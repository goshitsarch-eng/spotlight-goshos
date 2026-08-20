// gosh is launcher - about preferences page
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';

export function buildAboutPage() {
    const group = new Adw.PreferencesGroup({title: 'About'});
    group.add(new Adw.ActionRow({
        title: 'Gosh Is Launcher',
        subtitle: 'A compact launcher for GNOME Shell with interchangeable looks.',
    }));
    group.add(new Adw.ActionRow({
        title: 'Looks',
        subtitle: 'Spotlight, Omarchy (Walker), Pop!_OS (COSMIC), Ulauncher, KRunner, GNOME, Rofi, Raycast, Albert, Wofi, Fuzzel, Anyrun, Tofi, Light, PowerToys, Synapse, Onagre',
    }));
    group.add(new Adw.ActionRow({
        title: 'GNOME Shell',
        subtitle: '45, 46, 47, 48, 49, and 50 on Wayland',
    }));
    return [group];
}
