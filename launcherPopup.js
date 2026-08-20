// gosh is launcher - popup widget
// SPDX-License-Identifier: GPL-3.0-or-later

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import {buildSearchEntry} from './searchEntry.js';
import {buildResultsContainer} from './resultsContainer.js';
import {SelectionManager} from './selectionManager.js';
import {ResultsRenderer} from './resultsRenderer.js';
import {PopupKeyHandler} from './popupKeyHandler.js';
import {PopupBackdrop} from './popupBackdrop.js';
import {FocusLossWatcher} from './focusLossWatcher.js';
import {getTheme} from './themes.js';
import {invalidateRecentFiles} from './recentFilesSearch.js';
import {canOpenPopup} from './popupGate.js';
import {popupOrigin, popupWidthForWorkArea} from './popupPosition.js';

// the popup widget - a vertical box with a search entry and scrollable results
// added to gnome's chrome layer so it floats above all windows
//
// to capture clicks outside the popup we do not use Main.pushModal because a
// modal grab swallows pointer events before they reach the stage instead we
// place a transparent full-screen reactive backdrop actor behind the popup
// any click on the backdrop closes the popup clicks on the popup itself are
// received normally because the popup sits above the backdrop in the chrome
//
// keyboard input is captured via grab_key_focus on the entry which receives
// all key events while it has focus the escape key closes the popup
//
// this class owns the lifecycle (open/close/destroy) and holds a
// SelectionManager, a ResultsRenderer, and a PopupKeyHandler which each own
// one slice of what used to all live in this file directly
export const LauncherPopup = GObject.registerClass(
class LauncherPopup extends St.BoxLayout {
    _init(extension) {
        super._init({
            style_class: 'gosh-container',
            reactive: true,
            can_focus: true,
            visible: false,
            width: extension._settings.get_int('popup-width'),
        });
        // orientation set after init for gnome 45/46 compatibility
        // the Clutter.Orientation enum property was added in gnome 47
        this.set_vertical(true);

        this._settings = extension._settings;
        this._isOpen = false;
        this._positionIdleId = 0;
        this._closeIdleId = 0;
        this._stageKeyId = 0;
        this._backdrop = null;
        this._focusWatcher = new FocusLossWatcher(this);

        const {entryBox, entry, searchIcon} = buildSearchEntry(this._settings);
        this._entryBox = entryBox;
        this._entry = entry;
        this._searchIcon = searchIcon;

        const clutterText = this._entry.clutter_text;
        clutterText.set_x_expand(true);
        clutterText.connectObject(
            'text-changed', () => this._renderer.onTextChanged(this._entry.get_text()),
            this,
        );

        const {resultsScroll, resultsBox} = buildResultsContainer(this._settings);
        this._resultsScroll = resultsScroll;
        this._resultsBox = resultsBox;

        this._selection = new SelectionManager(resultsBox, resultsScroll);
        this._keyHandler = new PopupKeyHandler(this, this._selection, this._settings);
        this._renderer = new ResultsRenderer(
            resultsBox, resultsScroll, this._selection, this._settings,
            result => this.activateResult(result),
            (idx) => {
                // ignore hover selection briefly after keyboard nav
                // prevents scroll-induced enter-events from jumping selection
                if (GLib.get_monotonic_time() < this._keyHandler.suppressedUntil)
                    return;
                this._selection.applySelection(idx);
            }
        );

        this.add_child(this._entryBox);
        this.add_child(this._resultsScroll);
        this._applyChrome();

        this._settings.connectObject(
            'changed::launcher-theme', () => this._onChromeChanged(),
            'changed::popup-width', () => this._onWidthChanged(),
            'changed::popup-position', () => this._onPositionChanged(),
            'changed::show-search-icon', () => {
                this._searchIcon.visible = this._settings.get_boolean('show-search-icon');
            },
            'changed::results-max-height', () => {
                this._resultsScroll.style =
                    `max-height: ${this._settings.get_int('results-max-height')}px;`;
            },
            'changed::row-density', () => this._onChromeChanged(),
            'changed::show-section-headers', () => this._repaintIfOpen(),
            'changed::show-result-icons', () => this._repaintIfOpen(),
            'changed::show-descriptions', () => this._repaintIfOpen(),
            'changed::show-result-numbers', () => this._repaintIfOpen(),
            'changed::result-order', () => this._repaintIfOpen(),
            'changed::max-results', () => this._repaintIfOpen(),
            'changed::show-empty-suggestions', () => this._repaintIfOpen(),
            this,
        );

        // popup is added to chrome in open() after the backdrop
        // this ensures it naturally sits above the backdrop without needing
        // raise() or lower() calls which are unreliable on hidden actors
    }

    get isOpen() {
        return this._isOpen;
    }

    _applyChrome() {
        const theme = getTheme(this._settings.get_string('launcher-theme'));
        this._entry.hint_text = theme.hint;

        const classes = this.get_style_class_name().split(' ');
        for (const name of classes) {
            if (name.startsWith('gosh-theme-') || name.startsWith('gosh-density-'))
                this.remove_style_class_name(name);
        }

        this.add_style_class_name(`gosh-theme-${theme.id}`);
        this.add_style_class_name(`gosh-density-${this._settings.get_string('row-density')}`);
    }

    _onChromeChanged() {
        this._applyChrome();
        this._repaintIfOpen();
    }

    _repaintIfOpen() {
        if (!this._isOpen)
            return;
        this._renderer.onTextChanged(this._entry.get_text());
    }

    _onWidthChanged() {
        this.set_width(this._fittedWidth());
        if (this._isOpen)
            this._reposition();
    }

    _onPositionChanged() {
        if (this._isOpen)
            this._reposition();
    }

    // position the popup on the primary monitor
    // called once when the popup opens based on the empty-state height
    // the popup then grows downward from this fixed position as results appear
    // this prevents the popup from shifting upward when results grow
    _fittedWidth() {
        const monitor = Main.layoutManager.primaryMonitor;
        const requested = this._settings.get_int('popup-width');
        if (!monitor)
            return requested;
        const workArea = Main.layoutManager.getWorkAreaForMonitor(monitor.index);
        return popupWidthForWorkArea(requested, workArea.width);
    }

    _reposition() {
        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor)
            return;
        const workArea = Main.layoutManager.getWorkAreaForMonitor(monitor.index);
        const popupWidth = this._fittedWidth();
        this.set_width(popupWidth);
        const [, naturalHeight] = this.get_preferred_height(popupWidth);
        const origin = popupOrigin(
            workArea,
            popupWidth,
            naturalHeight,
            this._settings.get_string('popup-position'),
        );
        this.set_position(origin.x, origin.y);
    }

    open() {
        if (!Main.layoutManager.primaryMonitor)
            return;
        if (!canOpenPopup(
            this._isOpen,
            this.visible,
            Main.sessionMode.isLocked,
            Main.sessionMode.isGreeter,
        ))
            return;

        this._isOpen = true;

        // create and show backdrop first then popup - later addition to
        // chrome means higher in the stacking order so popup naturally
        // sits above the backdrop
        this._backdrop = new PopupBackdrop(() => this.closeSoon());
        this._backdrop.show();

        // always re-add popup to chrome to guarantee correct stacking order
        // if popup was left in chrome from a previous close remove it first
        if (this.get_parent())
            Main.layoutManager.removeChrome(this);
        Main.layoutManager.addChrome(this);

        // queue a layout pass then position before showing
        // ensures get_preferred_height returns correct values
        // otherwise css may not be applied and height is wrong
        this.set_width(this._fittedWidth());
        this._applyChrome();
        this.queue_relayout();
        this._positionIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._positionIdleId = 0;
            if (!this._isOpen)
                return GLib.SOURCE_REMOVE;
            this._reposition();
            this.show();
            // grab focus only after the popup is visible
            // grabbing focus on a hidden actor fails silently
            this._entry.grab_key_focus();
            // capture key events at the stage level during capture phase
            // this guarantees we see enter/esc/arrows before st entry can
            // consume them which was the root cause of keyboard not working
            this._stageKeyId = global.stage.connect('captured-event',
                (_, event) => this._keyHandler.handleEvent(event));
            this._focusWatcher.start();
            this._renderer.onTextChanged(this._entry.get_text());
            return GLib.SOURCE_REMOVE;
        });

        invalidateRecentFiles();
        this._entry.set_text('');
        this._renderer.reset();
    }

    // clutter 18 aborts if the actor tree changes inside an input handler
    // click-outside destroys the backdrop and activate hides this widget
    // so those paths schedule close after the event finishes
    closeSoon() {
        if (this._closeIdleId)
            return;
        this._closeIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            this._closeIdleId = 0;
            this.close();
            return GLib.SOURCE_REMOVE;
        });
    }

    activateResult(result) {
        this.closeSoon();
        result.activate();
    }

    close() {
        if (!this._isOpen && !this.visible)
            return;

        this._isOpen = false;

        if (this._stageKeyId) {
            global.stage.disconnect(this._stageKeyId);
            this._stageKeyId = 0;
        }
        this._focusWatcher.stop();
        this._clearIdle('_positionIdleId');
        this._clearIdle('_closeIdleId');
        this._renderer.destroy();

        if (this._backdrop) {
            this._backdrop.destroy();
            this._backdrop = null;
        }

        this.hide();
    }

    _clearIdle(field) {
        if (this[field]) {
            GLib.source_remove(this[field]);
            this[field] = 0;
        }
    }

    // overridden so that disable() -> destroy() tears down everything cleanly:
    // closes the popup which removes the backdrop and focus handler then
    // removes us from the chrome layer and chains up to the parent destroy
    destroy() {
        this._clearIdle('_positionIdleId');
        this._clearIdle('_closeIdleId');
        this.close();
        this._settings.disconnectObject(this);
        if (this.get_parent())
            Main.layoutManager.removeChrome(this);
        this._settings = null;
        super.destroy();
    }
});
