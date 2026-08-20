// gosh is launcher - a compact launcher for gnome shell
// SPDX-License-Identifier: GPL-3.0-or-later

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {LauncherPopup} from './launcherPopup.js';
import {KeybindingManager} from './keybinding.js';
import {shortcutRetryList, shortcutToPersist} from './shortcutAccel.js';
import {resetParentalGiveUp} from './appReady.js';
import {invalidateRecentFiles} from './recentFilesSearch.js';
import {invalidatePathLookup} from './pathSearch.js';
import {invalidateCommandLookup} from './commandSearch.js';
import {invalidateBookmarks} from './bookmarksSearch.js';

// entry point - enable and disable are kept next to each other for easy review
export default class GoshIsLauncherExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._popup = new LauncherPopup(this);

        this._keybindingManager = new KeybindingManager();
        this._keybindingManager.enable();

        const shortcuts = this._settings.get_strv('toggle-shortcut');
        const accelerator = shortcuts.length > 0 ? shortcuts[0] : '<Control>space';

        if (shortcuts.length === 0)
            this._settings.set_strv('toggle-shortcut', [accelerator]);

        this._bindToggle(accelerator);

        this._settings.connectObject('changed::toggle-shortcut', () => {
            const arr = this._settings.get_strv('toggle-shortcut');
            this._bindToggle(arr.length > 0 ? arr[0] : '<Control>space');
        }, this);
    }

    _togglePopup() {
        this._popup.toggleFromShortcut();
    }

    _bindToggle(accelerator) {
        const onToggle = () => this._togglePopup();
        if (this._keybindingManager.swapTo(accelerator, onToggle))
            return;

        const current = this._keybindingManager.currentAccelerator();
        const persistCurrent = shortcutToPersist(accelerator, current);
        if (persistCurrent) {
            this._settings.set_strv('toggle-shortcut', [persistCurrent]);
            return;
        }
        if (current)
            return;

        for (const accel of shortcutRetryList(accelerator, current)) {
            if (!this._keybindingManager.swapTo(accel, onToggle))
                continue;
            const persist = shortcutToPersist(accelerator, accel);
            if (persist)
                this._settings.set_strv('toggle-shortcut', [persist]);
            return;
        }
    }

    disable() {
        // gnome still calls disable when enable throws midway
        if (this._settings)
            this._settings.disconnectObject(this);

        if (this._keybindingManager) {
            this._keybindingManager.disable();
            this._keybindingManager = null;
        }

        // bump load ids before destroy so in-flight gio cannot repaint
        invalidateRecentFiles();
        invalidatePathLookup();
        invalidateCommandLookup();
        invalidateBookmarks();

        if (this._popup) {
            this._popup.destroy();
            this._popup = null;
        }

        resetParentalGiveUp();
        this._settings = null;
    }
}
