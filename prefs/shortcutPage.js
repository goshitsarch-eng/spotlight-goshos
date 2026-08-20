// gosh is launcher - shortcut preferences page
// SPDX-License-Identifier: GPL-3.0-or-later

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import {buildAccelerator, modifiersFromMask, formatShortcutList, isModifierKeyName} from '../shortcutAccel.js';

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
        label: formatShortcut(settings.get_strv('toggle-shortcut')),
        halign: Gtk.Align.END,
        valign: Gtk.Align.CENTER,
    });
    shortcutRow.add_suffix(shortcutLabel);
    shortcutRow.set_activatable(true);

    const eventController = new Gtk.EventControllerKey();
    let capturing = false;

    shortcutRow.connect('activated', () => {
        capturing = true;
        shortcutLabel.label = 'Press a key combination...';
        shortcutRow.grab_focus();
    });

    shortcutRow.connect('notify::has-focus', () => {
        if (shortcutRow.has_focus || !capturing)
            return;
        capturing = false;
        shortcutLabel.label = formatShortcut(settings.get_strv('toggle-shortcut'));
    });

    eventController.connect('key-pressed', (controller, keyval, keycode, state) => {
        if (!capturing)
            return false;

        if (keyval === Gdk.KEY_Escape) {
            capturing = false;
            shortcutLabel.label = formatShortcut(settings.get_strv('toggle-shortcut'));
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

        settings.set_strv('toggle-shortcut', [accelerator]);
        shortcutLabel.label = formatShortcut([accelerator]);
        capturing = false;
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
        settings.set_strv('toggle-shortcut', ['<Control>space']);
        shortcutLabel.label = formatShortcut(settings.get_strv('toggle-shortcut'));
    });
    resetRow.add_suffix(resetButton);
    group.add(resetRow);

    return group;
}

function formatShortcut(shortcutArray) {
    const text = formatShortcutList(shortcutArray);
    if (!text)
        return 'Not set (will default to Ctrl+Space)';
    return text;
}
