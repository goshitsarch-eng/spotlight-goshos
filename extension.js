// gosh is launcher - a compact launcher for gnome shell
// SPDX-License-Identifier: GPL-3.0-or-later

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {LauncherPopup} from './launcherPopup.js';
import {KeybindingManager} from './keybinding.js';
import {shouldCloseOnToggle} from './popupGate.js';
import {shortcutAttempts} from './shortcutAccel.js';

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
        if (shouldCloseOnToggle(this._popup.isOpen, this._popup.visible))
            this._popup.close();
        else
            this._popup.open();
    }

    _bindToggle(accelerator) {
        const onToggle = () => this._togglePopup();
        for (const accel of shortcutAttempts(accelerator)) {
            if (this._keybindingManager.swapTo(accel, onToggle))
                return;
        }
    }

    disable() {
        this._settings.disconnectObject(this);

        this._keybindingManager.disable();
        this._keybindingManager = null;

        this._popup.destroy();
        this._popup = null;

        this._settings = null;
    }
}
