// gosh is launcher - stage-level keyboard capture for the popup
// SPDX-License-Identifier: GPL-3.0-or-later

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import {resolveKeyAction, resolveHomeEndAction, resolveCtrlNav, isNavAction} from './keyAction.js';
import {activatableResult, indexedActivatableResult} from './resultActivate.js';
import {readPreedit, shouldPropagateForPreedit} from './entryPreedit.js';
import {shouldIgnoreNavRepeat} from './navRepeat.js';
import {shouldCaptureKeys} from './focusLoss.js';

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
    // numlock off sends these instead of the digit keysyms
    [Clutter.KEY_KP_Down]: 'Down',
    [Clutter.KEY_KP_Up]: 'Up',
    [Clutter.KEY_KP_Page_Down]: 'Page_Down',
    [Clutter.KEY_KP_Page_Up]: 'Page_Up',
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

const CTRL_NAV_KEYS = {
    [Clutter.KEY_j]: 'j',
    [Clutter.KEY_J]: 'j',
    [Clutter.KEY_n]: 'n',
    [Clutter.KEY_N]: 'n',
    [Clutter.KEY_k]: 'k',
    [Clutter.KEY_K]: 'k',
    [Clutter.KEY_p]: 'p',
    [Clutter.KEY_P]: 'p',
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
        if (!shouldCaptureKeys(
            true,
            Boolean(focus),
            focus === global.stage,
            Boolean(focus && this._popup.contains(focus)),
        ))
            return Clutter.EVENT_PROPAGATE;

        const clutterText = this._popup._entry.clutter_text;
        if (typeof clutterText.get_preedit_string === 'function') {
            const preedit = readPreedit(clutterText.get_preedit_string());
            if (shouldPropagateForPreedit(preedit))
                return Clutter.EVENT_PROPAGATE;
        }

        const key = event.get_key_symbol();
        const state = event.get_state();
        if (state & Clutter.ModifierType.CONTROL_MASK) {
            const ctrl = resolveCtrlNav(CTRL_NAV_KEYS[key] || '');
            if (ctrl) {
                if (this._ignoreRepeat(key))
                    return Clutter.EVENT_STOP;
                this._selection.moveSelection(ctrl.delta, this._suppressHover.bind(this));
                return Clutter.EVENT_STOP;
            }
        }

        const name = KEY_NAMES[key];
        if (!name)
            return Clutter.EVENT_PROPAGATE;

        const action = resolveHomeEndAction(
            name,
            clutterText.get_cursor_position(),
            clutterText.get_text().length,
        ) || resolveKeyAction(
            name,
            Boolean(state & Clutter.ModifierType.SHIFT_MASK),
            Boolean(state & Clutter.ModifierType.MOD1_MASK),
            this._settings.get_boolean('show-result-numbers'),
        );

        if (action.type === 'propagate')
            return Clutter.EVENT_PROPAGATE;

        if (isNavAction(action.type) && this._ignoreRepeat(key))
            return Clutter.EVENT_STOP;

        if (action.type === 'close') {
            this._popup.closeSoon();
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

    _ignoreRepeat(key) {
        const now = GLib.get_monotonic_time();
        if (shouldIgnoreNavRepeat(key, this._lastNavKey, now, this._lastNavKeyTime))
            return true;
        this._lastNavKey = key;
        this._lastNavKeyTime = now;
        return false;
    }

    _suppressHover() {
        this._keyboardNavSuppressUntil = GLib.get_monotonic_time() + 150000;
    }

    get suppressedUntil() {
        return this._keyboardNavSuppressUntil;
    }

    _activateIndex(index) {
        const chosen = indexedActivatableResult(this._selection.results, index);
        if (chosen)
            this._popup.activateResult(chosen);
        return Clutter.EVENT_STOP;
    }

    _activateSelected() {
        const chosen = activatableResult(this._selection.results, this._selection.selectedIndex);
        if (chosen)
            this._popup.activateResult(chosen);
    }
}
