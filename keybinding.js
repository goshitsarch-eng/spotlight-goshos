// gosh is launcher - keybinding manager
// SPDX-License-Identifier: GPL-3.0-or-later

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

// grabs keys via mutter instead of gsettings
// more reliable than addkeybinding which can fail if schema isn't ready at enable time
export class KeybindingManager {
    enable() {
        this._grabbers = {};
        this._eventId = global.display.connect('accelerator-activated', (_, action) => {
            const grabber = this._grabbers[action];
            if (grabber)
                grabber.callback();
        });
    }

    disable() {
        this.unlisten();
        if (this._eventId) {
            global.display.disconnect(this._eventId);
            this._eventId = 0;
        }
    }

    listenFor(accelerator, callback) {
        return this.swapTo(accelerator, callback);
    }

    // grab the new key first so a conflict cannot leave the launcher mute
    swapTo(accelerator, callback) {
        for (const k of Object.keys(this._grabbers)) {
            if (this._grabbers[k].accelerator === accelerator) {
                this._grabbers[k].callback = callback;
                this._dropExcept(parseInt(k, 10));
                return true;
            }
        }

        const action = global.display.grab_accelerator(accelerator, 0);
        if (action === Meta.KeyBindingAction.NONE) {
            console.warn(`gosh is launcher: failed to grab shortcut ${accelerator}`);
            return false;
        }

        const name = Meta.external_binding_name_for_action(action);
        // lock screen and greeter must not launch apps
        Main.wm.allowKeybinding(
            name, Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW);
        this._grabbers[action] = {name, accelerator, callback};
        this._dropExcept(action);
        return true;
    }

    _dropExcept(keepAction) {
        for (const k of Object.keys(this._grabbers)) {
            const action = parseInt(k, 10);
            if (action === keepAction)
                continue;
            Main.wm.removeKeybinding(this._grabbers[k].name);
            global.display.ungrab_accelerator(action);
            delete this._grabbers[k];
        }
    }

    unlisten() {
        for (const k of Object.keys(this._grabbers)) {
            Main.wm.removeKeybinding(this._grabbers[k].name);
            global.display.ungrab_accelerator(parseInt(k, 10));
        }
        this._grabbers = {};
    }
}
