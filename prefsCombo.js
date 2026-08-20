// gosh is launcher - keep combo rows in sync with gsettings
// SPDX-License-Identifier: GPL-3.0-or-later

export function comboSelectedIndex(items, currentId) {
    return items.findIndex(item => item.id === currentId);
}

// gio.settings outlives the prefs window
export function bindSettingsChanged(settings, key, widget, handler) {
    const id = settings.connect(`changed::${key}`, handler);
    widget.connect('destroy', () => settings.disconnect(id));
    return id;
}

// applyLookSettings and a failed theme write must move the combo
export function bindSettingsCombo(row, settings, key, items) {
    const apply = () => {
        const index = comboSelectedIndex(items, settings.get_string(key));
        if (index >= 0 && row.selected !== index)
            row.selected = index;
    };
    apply();
    row.connect('notify::selected', () => {
        const selected = items[row.selected];
        if (selected)
            settings.set_string(key, selected.id);
    });
    bindSettingsChanged(settings, key, row, apply);
}
