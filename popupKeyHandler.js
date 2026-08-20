// gosh is launcher - stage-level keyboard capture for the popup
// SPDX-License-Identifier: GPL-3.0-or-later

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import {resolveKeyAction, isNavAction} from './keyAction.js';

const KEY_NAMES = {
    [Clutter.KEY_Escape]: 'Escape',
    [Clutter.KEY_Down]: 'Down',
    [Clutter.KEY_Up]: 'Up',
    [Clutter.KEY_Tab]: 'Tab',
    [Clutter.KEY_ISO_Left_Tab]: 'ISO_Left_Tab',
    [Clutter.KEY_Page_Down]: 'Page_Down',
    [Clutter.KEY_Page_Up]: 'Page_Up',
    [Clutter.KEY_Home]: 'Home',
    [Clutter.KEY_End]: 'End',
    [Clutter.KEY_KP_Home]: 'Home',
    [Clutter.KEY_KP_End]: 'End',
    [Clutter.KEY_Return]: 'Return',
    [Clutter.KEY_KP_Enter]: 'KP_Enter',
    [Clutter.KEY_1]: '1',
    [Clutter.KEY_2]: '2',
    [Clutter.KEY_3]: '3',
    [Clutter.KEY_4]: '4',
    [Clutter.KEY_5]: '5',
    [Clutter.KEY_6]: '6',
    [Clutter.KEY_7]: '7',
    [Clutter.KEY_8]: '8',
    [Clutter.KEY_9]: '9',
    [Clutter.KEY_KP_1]: '1',
    [Clutter.KEY_KP_2]: '2',
    [Clutter.KEY_KP_3]: '3',
    [Clutter.KEY_KP_4]: '4',
    [Clutter.KEY_KP_5]: '5',
    [Clutter.KEY_KP_6]: '6',
    [Clutter.KEY_KP_7]: '7',
    [Clutter.KEY_KP_8]: '8',
    [Clutter.KEY_KP_9]: '9',
};

// captures key events at the stage level during the capture phase, before
// st entry can consume them
export class PopupKeyHandler {
    constructor(popup, selection, settings) {
        this._popup = popup;
        this._selection = selection;
        this._settings = settings;
        this._keyboardNavSuppressUntil = 0;
        this._lastNavKey = 0;
        this._lastNavKeyTime = 0;
    }

    handleEvent(event) {
        if (event.type() !== Clutter.EventType.KEY_PRESS)
            return Clutter.EVENT_PROPAGATE;

        if (!this._popup.visible)
            return Clutter.EVENT_PROPAGATE;

        const focus = global.stage.get_key_focus();
        if (!focus || !this._popup.contains(focus))
            return Clutter.EVENT_PROPAGATE;

        const key = event.get_key_symbol();
        const name = KEY_NAMES[key];
        if (!name)
            return Clutter.EVENT_PROPAGATE;

        const state = event.get_state();
        const action = resolveKeyAction(
            name,
            Boolean(state & Clutter.ModifierType.SHIFT_MASK),
            Boolean(state & Clutter.ModifierType.MOD1_MASK),
            this._settings.get_boolean('show-result-numbers'),
        );

        if (action.type === 'propagate')
            return Clutter.EVENT_PROPAGATE;

        if (isNavAction(action.type)) {
            const time = event.get_time();
            if (key === this._lastNavKey && time - this._lastNavKeyTime < 50)
                return Clutter.EVENT_STOP;
            this._lastNavKey = key;
            this._lastNavKeyTime = time;
        }

        if (action.type === 'close') {
            this._popup.close();
            return Clutter.EVENT_STOP;
        }
        if (action.type === 'move') {
            this._selection.moveSelection(action.delta, this._suppressHover.bind(this));
            return Clutter.EVENT_STOP;
        }
        if (action.type === 'activate-index')
            return this._activateIndex(action.index);
        if (action.type === 'activate') {
            this._activateSelected();
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _suppressHover() {
        this._keyboardNavSuppressUntil = GLib.get_monotonic_time() + 150000;
    }

    get suppressedUntil() {
        return this._keyboardNavSuppressUntil;
    }

    _activateIndex(index) {
        const {results} = this._selection;
        if (index >= 0 && index < results.length) {
            results[index].activate();
            this._popup.close();
        }
        return Clutter.EVENT_STOP;
    }

    _activateSelected() {
        const {results, selectedIndex} = this._selection;
        if (selectedIndex >= 0 && selectedIndex < results.length) {
            results[selectedIndex].activate();
            this._popup.close();
        } else if (results.length > 0) {
            results[0].activate();
            this._popup.close();
        }
    }
}
