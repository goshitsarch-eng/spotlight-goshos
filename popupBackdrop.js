// gosh is launcher - click-outside backdrop for the popup
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {backdropBox, backdropPointerAction} from './backdropBox.js';

// a transparent full-screen reactive actor that sits behind the popup in
// the chrome layer - any click on it closes the popup, which is how we
// detect click-outside without a modal grab swallowing pointer events
// before they reach the stage
//
// press must be claimed too or wayland delivers it to the window below
// and the matching release then activates that window after we close
//
// owns its own add/remove-from-chrome so launcherPopup.js just calls
// show()/destroy(), it never has to know how the backdrop gets on screen
function touchKind(eventType) {
    if (eventType === Clutter.EventType.TOUCH_BEGIN)
        return 'touch-begin';
    if (eventType === Clutter.EventType.TOUCH_UPDATE)
        return 'touch-update';
    if (eventType === Clutter.EventType.TOUCH_END)
        return 'touch-end';
    if (eventType === Clutter.EventType.TOUCH_CANCEL)
        return 'touch-cancel';
    return 'other';
}

function handleBackdropPointer(onClickOutside, kind) {
    const action = backdropPointerAction(kind);
    if (action === 'close')
        onClickOutside();
    if (action === 'propagate')
        return Clutter.EVENT_PROPAGATE;
    return Clutter.EVENT_STOP;
}

export class PopupBackdrop {
    constructor(onClickOutside) {
        this._actor = new St.Widget({
            reactive: true,
            can_focus: false,
            visible: false,
        });

        const box = backdropBox(Main.layoutManager.monitors);
        this._actor.set_size(box.width, box.height);
        this._actor.set_position(box.x, box.y);

        this._actor.connectObject(
            'button-press-event',
            () => handleBackdropPointer(onClickOutside, 'button-press'),
            'button-release-event',
            () => handleBackdropPointer(onClickOutside, 'button-release'),
            'touch-event',
            (_actor, event) => handleBackdropPointer(onClickOutside, touchKind(event.type())),
            this._actor
        );
    }

    show() {
        Main.layoutManager.addChrome(this._actor);
        this._actor.show();
    }

    relayout() {
        const box = backdropBox(Main.layoutManager.monitors);
        this._actor.set_size(box.width, box.height);
        this._actor.set_position(box.x, box.y);
    }

    destroy() {
        this._actor.disconnectObject(this._actor);
        if (this._actor.get_parent())
            Main.layoutManager.removeChrome(this._actor);
        this._actor.destroy();
    }
}
