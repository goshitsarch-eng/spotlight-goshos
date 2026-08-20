// gosh is launcher - keep combo rows in sync with gsettings
// SPDX-License-Identifier: GPL-3.0-or-later

export function comboSelectedIndex(items, currentId) {
    return items.findIndex(item => item.id === currentId);
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
    settings.connect(`changed::${key}`, apply);
}
