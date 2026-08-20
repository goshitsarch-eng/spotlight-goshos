// gosh is launcher - shortcut preferences page
// SPDX-License-Identifier: GPL-3.0-or-later

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import {buildAccelerator, modifiersFromMask, shortcutDisplayLabel, shortcutLabelAfterChange, isModifierKeyName} from '../shortcutAccel.js';
import {bindSettingsChanged} from '../prefsCombo.js';

export function buildShortcutPage(settings) {
    const group = new Adw.PreferencesGroup({
        title: 'Keyboard Shortcut',
        description: 'Set the shortcut to open Gosh Is Launcher',
    });

    const shortcutRow = new Adw.ActionRow({
        title: 'Toggle shortcut',
        subtitle: 'Click here, then press a key combination',
    });

    const shortcutLabel = new Gtk.Label({
        label: shortcutDisplayLabel(settings.get_strv('toggle-shortcut')),
        halign: Gtk.Align.END,
        valign: Gtk.Align.CENTER,
    });
    shortcutRow.add_suffix(shortcutLabel);
    shortcutRow.set_activatable(true);

    const eventController = new Gtk.EventControllerKey();
    let capturing = false;

    const refreshLabel = () => {
        const next = shortcutLabelAfterChange(settings.get_strv('toggle-shortcut'), capturing);
        if (next !== null)
            shortcutLabel.label = next;
    };

    bindSettingsChanged(settings, 'toggle-shortcut', shortcutRow, refreshLabel);

    shortcutRow.connect('activated', () => {
        capturing = true;
        shortcutLabel.label = 'Press a key combination...';
        shortcutRow.grab_focus();
    });

    shortcutRow.connect('notify::has-focus', () => {
        if (shortcutRow.has_focus || !capturing)
            return;
        capturing = false;
        refreshLabel();
    });

    eventController.connect('key-pressed', (controller, keyval, keycode, state) => {
        if (!capturing)
            return false;

        if (keyval === Gdk.KEY_Escape) {
            capturing = false;
            refreshLabel();
            return true;
        }

        const keyName = Gdk.keyval_name(keyval);
        if (!keyName || isModifierKeyName(keyName))
            return true;

        const accelerator = buildAccelerator(keyName, modifiersFromMask(state, {
            super: Gdk.ModifierType.SUPER_MASK,
            control: Gdk.ModifierType.CONTROL_MASK,
            shift: Gdk.ModifierType.SHIFT_MASK,
            alt: Gdk.ModifierType.ALT_MASK,
            meta: Gdk.ModifierType.META_MASK,
        }));
        if (!accelerator)
            return true;

        capturing = false;
        settings.set_strv('toggle-shortcut', [accelerator]);
        refreshLabel();
        return true;
    });

    shortcutRow.add_controller(eventController);
    group.add(shortcutRow);

    const resetRow = new Adw.ActionRow({
        title: 'Reset to default',
        subtitle: 'Set shortcut to Ctrl+Space',
    });
    const resetButton = new Gtk.Button({
        label: 'Reset',
        valign: Gtk.Align.CENTER,
    });
    resetButton.connect('clicked', () => {
        capturing = false;
        settings.set_strv('toggle-shortcut', ['<Control>space']);
        refreshLabel();
    });
    resetRow.add_suffix(resetButton);
    group.add(resetRow);

    return group;
}
