// gosh is launcher - result row widget
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import {ellipsizeLabel} from './labelEllipsize.js';
import {rowPointerAction} from './resultPointer.js';

// builds a single result row with icon title and click/hover handling
export function buildResultRow(result, resultIndex, onActivate, onHover, options) {
    const showNumbers = options.showNumbers;
    const hbox = new St.BoxLayout({
        style_class: 'gosh-result',
        vertical: false,
        reactive: true,
        can_focus: true,
        track_hover: true,
    });

    const iconParams = {
        fallback_icon_name: 'application-x-executable',
        style_class: 'gosh-result-icon',
        icon_size: options.iconSize,
    };

    if (result.app)
        iconParams.gicon = result.app.get_icon();
    else if (typeof result.icon === 'string')
        iconParams.icon_name = result.icon;
    else if (result.icon)
        iconParams.gicon = result.icon;
    else
        iconParams.icon_name = 'application-x-executable-symbolic';

    const icon = new St.Icon(iconParams);
    icon.visible = options.showIcons;

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

    hbox.add_child(icon);
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

    hbox.connectObject(
        'button-press-event', (_actor, event) => {
            const next = rowPointerAction('press', event.get_button(), pressed);
            pressed = next.pressed;
            return next.action === 'propagate' ? Clutter.EVENT_PROPAGATE : Clutter.EVENT_STOP;
        },
        'button-release-event', (_actor, event) => {
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
            return Clutter.EVENT_PROPAGATE;
        },
        'enter-event', () => {
            onHover(resultIndex);
            return Clutter.EVENT_PROPAGATE;
        },
        hbox,
    );

    return hbox;
}
