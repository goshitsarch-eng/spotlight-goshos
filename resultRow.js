// gosh is launcher - result row widget
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import Clutter from 'gi://Clutter';

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
    });
    text.add_child(new St.Label({
        style_class: 'gosh-result-title',
        text: result.title,
    }));
    if (result.description && options.showDescriptions) {
        text.add_child(new St.Label({
            style_class: 'gosh-result-description',
            text: result.description,
        }));
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

    hbox.connectObject(
        'button-release-event', () => {
            onActivate(result);
            return Clutter.EVENT_STOP;
        },
        'enter-event', () => {
            onHover(resultIndex);
            return Clutter.EVENT_PROPAGATE;
        },
        hbox,
    );

    return hbox;
}
