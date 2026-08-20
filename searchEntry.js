// gosh is launcher - search entry widget
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import {getTheme} from './themes.js';

// builds the search entry box with icon and text field
export function buildSearchEntry(settings) {
    const theme = getTheme(settings.get_string('launcher-theme'));
    const entryBox = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        style_class: 'gosh-entry-box',
    });

    const searchIcon = new St.Icon({
        icon_name: 'system-search-symbolic',
        style_class: 'gosh-search-icon',
        icon_size: 20,
        y_align: Clutter.ActorAlign.CENTER,
        visible: settings.get_boolean('show-search-icon'),
    });

    const entry = new St.Entry({
        style_class: 'gosh-entry',
        hint_text: theme.hint,
        can_focus: true,
        x_expand: true,
    });

    entryBox.add_child(searchIcon);
    entryBox.add_child(entry);

    return {entryBox, entry, searchIcon};
}
