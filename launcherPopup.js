// gosh is launcher - popup widget
// SPDX-License-Identifier: GPL-3.0-or-later

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as ParentalControlsManager from 'resource:///org/gnome/shell/misc/parentalControlsManager.js';
import St from 'gi://St';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';

import {buildSearchEntry} from './searchEntry.js';
import {buildResultsContainer} from './resultsContainer.js';
import {SelectionManager} from './selectionManager.js';
import {ResultsRenderer} from './resultsRenderer.js';
import {PopupKeyHandler} from './popupKeyHandler.js';
import {PopupBackdrop} from './popupBackdrop.js';
import {FocusLossWatcher} from './focusLossWatcher.js';
import {LiveSearchWatcher} from './liveSearchWatcher.js';
import {getTheme, applyLookSettings} from './themes.js';
import {invalidateRecentFiles} from './recentFilesSearch.js';
import {invalidatePathLookup} from './pathSearch.js';
import {invalidateCommandLookup} from './commandSearch.js';
import {invalidateBookmarks} from './bookmarksSearch.js';
import {canOpenPopup, shouldCloseOnSession, sessionLimitsReached, timeLimitsState, nextReopenAfterClose, nextToggleAction, shouldCancelOpenOnShellUi, shouldCloseOnShellUi} from './popupGate.js';
import {popupChromeShouldFocus, shouldRunRefocus} from './focusLoss.js';
import {activateResultSafe, resultCanActivate} from './resultActivate.js';
import {shouldApplyHoverSelection} from './resultPointer.js';
import {popupWidthForWorkArea, placePopup, workAreaAvoidingKeyboard, keyboardOverlapFromBox} from './popupPosition.js';
import {addPopupChrome, removePopupChrome} from './popupChrome.js';
import {unredirectApi, nextUnredirectAction} from './unredirect.js';
import {PARENTAL_GIVE_UP_MS, markParentalGiveUp} from './appReady.js';

// the popup widget - a vertical box with a search entry and scrollable results
// added with addtopchrome so it floats above always-on-top windows
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
            can_focus: popupChromeShouldFocus(),
            visible: false,
            width: extension._settings.get_int('popup-width'),
        });
        // orientation set after init for gnome 45/46 compatibility
        // the Clutter.Orientation enum property was added in gnome 47
        this.set_vertical(true);

        this._settings = extension._settings;
        this._isOpen = false;
        this._positionIdleId = 0;
        this._openIdleId = 0;
        this._repaintIdleId = 0;
        this._layoutIdleId = 0;
        this._closeIdleId = 0;
        this._refocusIdleId = 0;
        this._stageKeyId = 0;
        this._monitorsId = 0;
        this._keyboardBox = null;
        this._backdrop = null;
        this._sessionId = 0;
        this._overviewId = 0;
        this._systemModalId = 0;
        this._timeLimitsId = 0;
        this._parentalGiveUpId = 0;
        this._parental = null;
        this._unredirectHeld = false;
        this._reopenAfterClose = false;
        this._focusWatcher = new FocusLossWatcher(this);
        this._liveSearch = new LiveSearchWatcher(() => this._repaintIfOpen());
        this._listenSession();
        this._listenOverview();
        this._listenSystemModal();
        this._listenTimeLimits();
        this._listenParental();

        const {entryBox, entry, searchIcon} = buildSearchEntry(this._settings);
        this._entryBox = entryBox;
        this._entry = entry;
        this._searchIcon = searchIcon;

        const clutterText = this._entry.clutter_text;
        clutterText.set_x_expand(true);

        const {resultsScroll, resultsBox} = buildResultsContainer(this._settings);
        this._resultsScroll = resultsScroll;
        this._resultsBox = resultsBox;

        this._selection = new SelectionManager(resultsBox, resultsScroll);
        this._keyHandler = new PopupKeyHandler(this, this._selection, this._settings);
        this._renderer = new ResultsRenderer(
            resultsBox, resultsScroll, this._selection, this._settings,
            result => this.activateResult(result),
            (idx) => {
                if (!shouldApplyHoverSelection(
                    this._renderer.isPainting,
                    GLib.get_monotonic_time(),
                    this._keyHandler.suppressedUntil,
                ))
                    return;
                this._selection.applySelection(idx);
            }
        );
        // connect after the renderer exists so an early text-changed cannot throw
        clutterText.connectObject(
            'text-changed', () => this._renderer.onTextChanged(this._entry.get_text()),
            this,
        );

        this.add_child(this._entryBox);
        this.add_child(this._resultsScroll);
        this._applyChrome();

        this._settings.connectObject(
            'changed::launcher-theme', () => this._onLookChanged(),
            'changed::popup-width', () => this._onWidthChanged(),
            'changed::popup-position', () => this._onPositionChanged(),
            'changed::show-search-icon', () => {
                this._searchIcon.visible = this._settings.get_boolean('show-search-icon');
            },
            'changed::results-max-height', () => this._fitResultsHeight(),
            'changed::row-density', () => this._onChromeChanged(),
            'changed::icon-size', () => this._repaintIfOpen(),
            'changed::show-section-headers', () => this._repaintIfOpen(),
            'changed::show-result-icons', () => this._repaintIfOpen(),
            'changed::show-descriptions', () => this._repaintIfOpen(),
            'changed::show-result-numbers', () => this._repaintIfOpen(),
            'changed::result-order', () => this._repaintIfOpen(),
            'changed::max-results', () => this._repaintIfOpen(),
            'changed::show-empty-suggestions', () => this._repaintIfOpen(),
            'changed::enable-app-search', () => this._repaintIfOpen(),
            'changed::enable-app-actions', () => this._repaintIfOpen(),
            'changed::enable-calculator', () => this._repaintIfOpen(),
            'changed::enable-unit-convert', () => this._repaintIfOpen(),
            'changed::enable-color-hex', () => this._repaintIfOpen(),
            'changed::enable-window-search', () => this._repaintIfOpen(),
            'changed::enable-system-actions', () => this._repaintIfOpen(),
            'changed::enable-settings-search', () => this._repaintIfOpen(),
            'changed::enable-recent-files', () => this._repaintIfOpen(),
            'changed::enable-url-open', () => this._repaintIfOpen(),
            'changed::enable-path-open', () => this._repaintIfOpen(),
            'changed::enable-places', () => this._repaintIfOpen(),
            'changed::enable-bookmarks', () => this._repaintIfOpen(),
            'changed::enable-time-date', () => this._repaintIfOpen(),
            'changed::enable-command-run', () => this._repaintIfOpen(),
            'changed::enable-prefix-modes', () => this._repaintIfOpen(),
            'changed::show-web-search', () => this._repaintIfOpen(),
            'changed::web-search-engine', () => this._repaintIfOpen(),
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

    // dconf writes must apply popos chrome not only the css class
    _onLookChanged() {
        applyLookSettings(this._settings, getTheme(this._settings.get_string('launcher-theme')));
        this._onChromeChanged();
    }

    _onChromeChanged() {
        this._applyChrome();
        this._repaintIfOpen();
    }

    _repaintIfOpen() {
        if (!this._isOpen || this._repaintIdleId)
            return;
        // dconf can arrive while a key is still dispatching
        this._repaintIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._repaintIdleId = 0;
            if (!this._isOpen)
                return GLib.SOURCE_REMOVE;
            this._renderer.repaintKeepingSelection();
            return GLib.SOURCE_REMOVE;
        });
    }

    _onWidthChanged() {
        if (this._isOpen)
            this._scheduleLayout();
        else
            this.set_width(this._fittedWidth());
    }

    _onPositionChanged() {
        if (this._isOpen)
            this._scheduleLayout();
    }

    // dconf can arrive while a key is still dispatching
    _scheduleLayout() {
        if (!this._isOpen || this._layoutIdleId)
            return;
        this._layoutIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._layoutIdleId = 0;
            if (!this._isOpen)
                return GLib.SOURCE_REMOVE;
            this.set_width(this._fittedWidth());
            this._reposition();
            return GLib.SOURCE_REMOVE;
        });
    }

    _listenMonitors() {
        if (this._monitorsId)
            return;
        this._monitorsId = Main.layoutManager.connect('monitors-changed', () => {
            if (this._isOpen)
                this._refitForMonitors();
        });
    }

    _unlistenMonitors() {
        if (!this._monitorsId)
            return;
        Main.layoutManager.disconnect(this._monitorsId);
        this._monitorsId = 0;
    }

    _listenKeyboard() {
        if (this._keyboardBox)
            return;
        const box = Main.layoutManager.keyboardBox;
        if (!box)
            return;
        // keyboardbox can vanish while the osk is rebuilding
        try {
            box.connectObject(
                'notify::visible', () => this._onKeyboardChanged(),
                'notify::allocation', () => this._onKeyboardChanged(),
                'notify::translation-y', () => this._onKeyboardChanged(),
                this,
            );
            this._keyboardBox = box;
        } catch (e) {
            this._keyboardBox = null;
        }
    }

    _unlistenKeyboard() {
        if (!this._keyboardBox)
            return;
        try {
            this._keyboardBox.disconnectObject(this);
        } catch (e) {
            // keyboardbox can vanish while the osk is rebuilding
        }
        this._keyboardBox = null;
    }

    _onKeyboardChanged() {
        if (this._isOpen)
            this._scheduleLayout();
    }

    _unredirectApi() {
        return unredirectApi(
            Boolean(global.compositor && typeof global.compositor.disable_unredirect === 'function'),
            typeof Meta.disable_unredirect_for_display === 'function',
        );
    }

    _setUnredirectHeld(wantHeld) {
        const api = this._unredirectApi();
        const action = nextUnredirectAction(this._unredirectHeld, wantHeld, api);
        if (action === 'hold') {
            if (api === 'compositor')
                global.compositor.disable_unredirect();
            else
                Meta.disable_unredirect_for_display(global.display);
            this._unredirectHeld = true;
            return;
        }
        if (action !== 'release')
            return;
        if (api === 'compositor')
            global.compositor.enable_unredirect();
        else
            Meta.enable_unredirect_for_display(global.display);
        this._unredirectHeld = false;
    }

    _usableWorkArea() {
        const monitor = Main.layoutManager.primaryMonitor;
        const workArea = Main.layoutManager.getWorkAreaForMonitor(monitor.index);
        return workAreaAvoidingKeyboard(
            workArea,
            keyboardOverlapFromBox(
                Main.layoutManager.keyboardBox,
                Main.layoutManager.keyboardIndex,
                monitor.index,
            ),
        );
    }

    _listenSession() {
        if (this._sessionId)
            return;
        // super+l can update the session during a key handler
        this._sessionId = Main.sessionMode.connect('updated', () => {
            if (shouldCloseOnSession(
                Main.sessionMode.isLocked,
                Main.sessionMode.isGreeter,
                this._limitsReached(),
            ))
                this.closeSoon();
        });
    }

    _unlistenSession() {
        if (!this._sessionId)
            return;
        Main.sessionMode.disconnect(this._sessionId);
        this._sessionId = 0;
    }

    // addtopchrome paints above the overview so super must close us
    _listenOverview() {
        if (this._overviewId)
            return;
        if (!Main.overview)
            return;
        this._overviewId = Main.overview.connect('showing', () => {
            if (shouldCancelOpenOnShellUi(Boolean(this._openIdleId)))
                this.cancelPendingOpen();
            if (shouldCloseOnShellUi(this._isOpen, this.visible))
                this.closeSoon();
        });
    }

    _unlistenOverview() {
        if (!this._overviewId)
            return;
        Main.overview.disconnect(this._overviewId);
        this._overviewId = 0;
    }

    // screenshot and polkit emit this so addtopchrome cannot cover their grab
    // https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/screenshot.js
    _listenSystemModal() {
        if (this._systemModalId)
            return;
        this._systemModalId = Main.layoutManager.connect('system-modal-opened', () => {
            if (shouldCancelOpenOnShellUi(Boolean(this._openIdleId)))
                this.cancelPendingOpen();
            if (shouldCloseOnShellUi(this._isOpen, this.visible))
                this.closeSoon();
        });
    }

    _unlistenSystemModal() {
        if (!this._systemModalId)
            return;
        Main.layoutManager.disconnect(this._systemModalId);
        this._systemModalId = 0;
    }

    _limitsReached() {
        return sessionLimitsReached(timeLimitsState(Main.timeLimitsManager));
    }

    // gnome 50 wellbeing / malcontent shield must not leave the launcher up
    _listenTimeLimits() {
        if (this._timeLimitsId)
            return;
        const manager = Main.timeLimitsManager;
        if (!manager)
            return;
        this._timeLimitsId = manager.connect('notify::state', () => {
            if (shouldCloseOnSession(
                Main.sessionMode.isLocked,
                Main.sessionMode.isGreeter,
                sessionLimitsReached(manager.state),
            ))
                this.closeSoon();
        });
    }

    _unlistenTimeLimits() {
        if (!this._timeLimitsId)
            return;
        const manager = Main.timeLimitsManager;
        if (manager)
            manager.disconnect(this._timeLimitsId);
        this._timeLimitsId = 0;
    }

    _listenParental() {
        const pcm = ParentalControlsManager.getDefault();
        this._parental = pcm;
        // init and later filter edits both emit this
        pcm.connectObject('app-filter-changed', () => this._repaintIfOpen(), this);
        if (pcm.initialized)
            return;
        this._parentalGiveUpId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, PARENTAL_GIVE_UP_MS, () => {
            this._parentalGiveUpId = 0;
            if (!pcm.initialized) {
                markParentalGiveUp();
                this._repaintIfOpen();
            }
            return GLib.SOURCE_REMOVE;
        });
    }

    _unlistenParental() {
        this._clearIdle('_parentalGiveUpId');
        if (!this._parental)
            return;
        this._parental.disconnectObject(this);
        this._parental = null;
    }

    _refitForMonitors() {
        if (!Main.layoutManager.primaryMonitor) {
            this.closeSoon();
            return;
        }
        if (this._backdrop)
            this._backdrop.relayout();
        this.set_width(this._fittedWidth());
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

    // entry only so a width change does not recast the origin from the
    // taller results height and walk the popup up the screen
    _emptyPopupHeight(popupWidth) {
        const [, entryHeight] = this._entryBox.get_preferred_height(popupWidth);
        return entryHeight;
    }

    _fitResultsHeight() {
        if (this._isOpen)
            this._scheduleLayout();
        else
            this._resultsScroll.style = `max-height: ${this._settings.get_int('results-max-height')}px;`;
    }

    _reposition() {
        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor)
            return;
        const workArea = this._usableWorkArea();
        const popupWidth = this._fittedWidth();
        this.set_width(popupWidth);
        const placed = placePopup(
            workArea,
            popupWidth,
            this._emptyPopupHeight(popupWidth),
            this._settings.get_string('popup-position'),
            this._settings.get_int('results-max-height'),
        );
        this.set_position(placed.x, placed.y);
        this._resultsScroll.style = `max-height: ${placed.resultsMax}px;`;
    }

    // accelerator-activated still runs inside clutter 18 key dispatch
    toggleFromShortcut() {
        const action = nextToggleAction(
            this._isOpen,
            this.visible,
            Boolean(this._openIdleId),
            Boolean(this._closeIdleId),
        );
        if (action === 'toggle-reopen')
            this.armReopenAfterClose();
        else if (action === 'cancel-open')
            this.cancelPendingOpen();
        else if (action === 'close')
            this.closeSoon();
        else
            this.openSoon();
    }

    openSoon() {
        if (this._openIdleId || this._isOpen || this.visible)
            return;
        this._openIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            this._openIdleId = 0;
            this.open();
            return GLib.SOURCE_REMOVE;
        });
    }

    cancelPendingOpen() {
        if (!this._openIdleId)
            return false;
        this._clearIdle('_openIdleId');
        return true;
    }

    open() {
        if (!Main.layoutManager.primaryMonitor)
            return;
        if (!canOpenPopup(
            this._isOpen,
            this.visible,
            Main.sessionMode.isLocked,
            Main.sessionMode.isGreeter,
            this._limitsReached(),
        ))
            return;

        this._isOpen = true;
        this._setUnredirectHeld(true);

        // create and show backdrop first then popup - later addition to
        // chrome means higher in the stacking order so popup naturally
        // sits above the backdrop
        this._backdrop = new PopupBackdrop(() => this.closeSoon());
        this._backdrop.show();
        this._listenMonitors();
        this._listenKeyboard();
        this._liveSearch.start();

        // always re-add popup to chrome to guarantee correct stacking order
        // if popup was left in chrome from a previous close remove it first
        if (this.get_parent())
            removePopupChrome(Main.layoutManager, this);
        addPopupChrome(Main.layoutManager, this);

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
        invalidatePathLookup();
        invalidateCommandLookup();
        invalidateBookmarks();
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
            const reopen = this._reopenAfterClose;
            this._reopenAfterClose = false;
            this.close();
            if (reopen)
                this.open();
            return GLib.SOURCE_REMOVE;
        });
    }

    // clutter 18 still needs the deferred teardown so flip the reopen
    // flag instead of calling open while the widget is mid-close
    armReopenAfterClose() {
        if (!this._closeIdleId)
            return false;
        this._reopenAfterClose = nextReopenAfterClose(true, this._reopenAfterClose);
        return true;
    }

    activateResult(result) {
        if (!resultCanActivate(result)) {
            this.refocusEntrySoon();
            return;
        }
        this.closeSoon();
        activateResultSafe(result);
    }

    // notify::key-focus and button-release must not grab during dispatch
    refocusEntrySoon() {
        if (this._refocusIdleId)
            return;
        this._refocusIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            this._refocusIdleId = 0;
            if (!shouldRunRefocus(this._isOpen, this.visible))
                return GLib.SOURCE_REMOVE;
            this._entry.grab_key_focus();
            return GLib.SOURCE_REMOVE;
        });
    }

    close() {
        this._clearIdle('_openIdleId');
        this._clearIdle('_repaintIdleId');
        this._clearIdle('_layoutIdleId');
        if (!this._isOpen && !this.visible)
            return;

        this._isOpen = false;
        this._setUnredirectHeld(false);

        if (this._stageKeyId) {
            global.stage.disconnect(this._stageKeyId);
            this._stageKeyId = 0;
        }
        this._focusWatcher.stop();
        this._liveSearch.stop();
        this._unlistenMonitors();
        this._unlistenKeyboard();
        this._clearPopupIdles();
        // bump load ids before destroy so in-flight gio cannot repaint
        invalidateRecentFiles();
        invalidatePathLookup();
        invalidateCommandLookup();
        invalidateBookmarks();
        this._renderer.destroy();

        if (this._backdrop) {
            this._backdrop.destroy();
            this._backdrop = null;
        }

        this.hide();
        // grab_key_focus leaves the hidden entry focused so later typing
        // would vanish unless we give the stage back only when we still own it
        // alt-tab already moved focus so leave that window alone
        const focus = global.stage.get_key_focus();
        if (focus && this.contains(focus))
            global.stage.set_key_focus(null);
    }

    _clearIdle(field) {
        if (this[field]) {
            GLib.source_remove(this[field]);
            this[field] = 0;
        }
    }

    _clearPopupIdles() {
        this._clearIdle('_positionIdleId');
        this._clearIdle('_openIdleId');
        this._clearIdle('_closeIdleId');
        this._clearIdle('_repaintIdleId');
        this._clearIdle('_layoutIdleId');
        this._clearIdle('_refocusIdleId');
    }

    // overridden so that disable() -> destroy() tears down everything cleanly:
    // closes the popup which removes the backdrop and focus handler then
    // removes us from the chrome layer and chains up to the parent destroy
    destroy() {
        this._reopenAfterClose = false;
        this._clearPopupIdles();
        this._unlistenSession();
        this._unlistenOverview();
        this._unlistenSystemModal();
        this._unlistenTimeLimits();
        this._unlistenParental();
        this._liveSearch.stop();
        this.close();
        this._setUnredirectHeld(false);
        this._unlistenKeyboard();
        this._settings.disconnectObject(this);
        if (this.get_parent())
            removePopupChrome(Main.layoutManager, this);
        this._settings = null;
        super.destroy();
    }
});
