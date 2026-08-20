// gosh is launcher - detects focus leaving the popup and closes it
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import {focusIsSearchEntry, focusLossAction} from './focusLoss.js';

// watches notify::key-focus on global.stage - if focus moves to an actor
// outside the popup, for example via alt-tab, the popup closes
// a click on a row or scrollbar that still steals focus is returned
// to the entry so later letters do not vanish
//
// setup is deferred via an idle source to avoid firing during the initial
// grab_key_focus call in open(), which would otherwise close the popup
// immediately after it opens
export class FocusLossWatcher {
    constructor(popup) {
        this._popup = popup;
        this._focusIdleId = 0;
        this._keyFocusId = 0;
    }

    start() {
        this.stop();
        this._focusIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._focusIdleId = 0;
            if (!this._popup.visible)
                return GLib.SOURCE_REMOVE;
            this._keyFocusId = global.stage.connect('notify::key-focus', () => {
                if (!this._popup.visible)
                    return;
                const focus = global.stage.get_key_focus();
                const action = focusLossAction(
                    Boolean(focus),
                    focus === global.stage,
                    Boolean(focus && this._popup.contains(focus)),
                    focusIsSearchEntry(focus, this._popup._entry),
                );
                if (action === 'close')
                    this._popup.closeSoon();
                else if (action === 'refocus-entry')
                    // grab during this notify aborts clutter 18
                    this._popup.refocusEntrySoon();
            });
            return GLib.SOURCE_REMOVE;
        });
    }

    stop() {
        if (this._keyFocusId) {
            global.stage.disconnect(this._keyFocusId);
            this._keyFocusId = 0;
        }
        if (this._focusIdleId) {
            GLib.source_remove(this._focusIdleId);
            this._focusIdleId = 0;
        }
    }
}
