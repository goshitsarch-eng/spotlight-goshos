// gosh is launcher - result row widget
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import {ellipsizeLabel} from './labelEllipsize.js';
import {rowPointerAction, eventCoordY, touchMovedPastSlop, rowTouchGestureAction, shouldIgnorePointerForTouch} from './resultPointer.js';

// wayland may emit button-press from a finger the touch path already owns
function pointerFromTouchscreen(event) {
    const kinds = Clutter.InputDeviceType;
    if (!kinds || kinds.TOUCHSCREEN === undefined)
        return false;
    if (typeof event.get_source_device !== 'function')
        return false;
    const device = event.get_source_device();
    return Boolean(device && device.get_device_type() === kinds.TOUCHSCREEN);
}
import {resultRowShouldFocus} from './focusLoss.js';
import {resultIconSource, shouldBuildResultIcon} from './resultIcon.js';

// builds a single result row with icon title and click/hover handling
export function buildResultRow(result, resultIndex, onActivate, onHover, options) {
    const showNumbers = options.showNumbers;
    const hbox = new St.BoxLayout({
        style_class: 'gosh-result',
        vertical: false,
        reactive: true,
        can_focus: resultRowShouldFocus(),
        track_hover: true,
    });

    const text = new St.BoxLayout({
        style_class: 'gosh-result-content',
        vertical: true,
        y_align: Clutter.ActorAlign.CENTER,
        x_expand: true,
        x_align: Clutter.ActorAlign.FILL,
    });
    const title = new St.Label({
        style_class: 'gosh-result-title',
        text: result.title,
    });
    ellipsizeLabel(title);
    text.add_child(title);
    if (result.description && options.showDescriptions) {
        const description = new St.Label({
            style_class: 'gosh-result-description',
            text: result.description,
        });
        ellipsizeLabel(description);
        text.add_child(description);
    }

    if (shouldBuildResultIcon(options.showIcons)) {
        hbox.add_child(new St.Icon({
            fallback_icon_name: 'application-x-executable',
            style_class: 'gosh-result-icon',
            icon_size: options.iconSize,
            ...resultIconSource(result),
        }));
    }
    hbox.add_child(text);

    if (showNumbers && resultIndex < 9) {
        hbox.add_child(new St.Label({
            style_class: 'gosh-result-index',
            text: String(resultIndex + 1),
            y_align: Clutter.ActorAlign.CENTER,
        }));
    }

    hbox._resultIndex = resultIndex;
    let pressed = false;
    let touchStartY = null;
    let touchDragged = false;

    hbox.connectObject(
        'button-press-event', (_actor, event) => {
            // wayland may synthesize this from the same finger
            if (shouldIgnorePointerForTouch(pointerFromTouchscreen(event)))
                return Clutter.EVENT_PROPAGATE;
            const next = rowPointerAction('press', event.get_button(), pressed);
            pressed = next.pressed;
            return next.action === 'propagate' ? Clutter.EVENT_PROPAGATE : Clutter.EVENT_STOP;
        },
        'button-release-event', (_actor, event) => {
            if (shouldIgnorePointerForTouch(pointerFromTouchscreen(event)))
                return Clutter.EVENT_PROPAGATE;
            const next = rowPointerAction('release', event.get_button(), pressed);
            pressed = next.pressed;
            if (next.action === 'activate')
                onActivate(result);
            return next.action === 'propagate' ? Clutter.EVENT_PROPAGATE : Clutter.EVENT_STOP;
        },
        'leave-event', (_actor, event) => {
            const related = typeof event.get_related === 'function' ? event.get_related() : null;
            if (related && hbox.contains(related))
                return Clutter.EVENT_PROPAGATE;
            const next = rowPointerAction('leave', 0, pressed);
            pressed = next.pressed;
            touchStartY = null;
            touchDragged = false;
            return Clutter.EVENT_PROPAGATE;
        },
        'enter-event', () => {
            onHover(resultIndex);
            return Clutter.EVENT_PROPAGATE;
        },
        'touch-event', (_actor, event) => {
            const type = event.type();
            let kind = 'other';
            if (type === Clutter.EventType.TOUCH_BEGIN)
                kind = 'touch-begin';
            else if (type === Clutter.EventType.TOUCH_END)
                kind = 'touch-end';
            else if (type === Clutter.EventType.TOUCH_CANCEL)
                kind = 'touch-cancel';
            else if (type === Clutter.EventType.TOUCH_UPDATE)
                kind = 'touch-update';
            const y = eventCoordY(
                typeof event.get_coords === 'function' ? event.get_coords() : null,
            );
            if (kind === 'touch-begin') {
                touchStartY = y;
                touchDragged = false;
            } else if (kind === 'touch-update' && touchMovedPastSlop(touchStartY, y)) {
                touchDragged = true;
            }
            const next = rowTouchGestureAction(kind, pressed, touchDragged);
            pressed = next.pressed;
            touchDragged = next.dragged;
            if (next.action === 'activate')
                onActivate(result);
            return Clutter.EVENT_PROPAGATE;
        },
        hbox,
    );

    return hbox;
}
