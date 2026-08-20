// gosh is launcher - theme catalog
// SPDX-License-Identifier: GPL-3.0-or-later

// pure data so both the shell process and the prefs process can import it
// without crossing the gtk / clutter isolation boundary
// https://gjs.guide/extensions/development/preferences.html

export const THEMES = [
    {
        id: 'spotlight',
        title: 'Spotlight',
        description: 'Compact macOS-inspired pill with a separate results card',
        hint: 'Search apps...',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: true,
            resultOrder: 'default',
        },
    },
    {
        id: 'omarchy',
        title: 'Omarchy',
        description: 'Walker-style Tokyo Night panel used by Omarchy Linux',
        hint: 'Search...',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: true,
            resultOrder: 'default',
        },
    },
    {
        id: 'popos',
        title: 'Pop!_OS',
        description: 'COSMIC launcher look with windows first and number hints',
        hint: 'Type to search',
        look: {
            position: 'top',
            density: 'comfortable',
            showNumbers: true,
            showHeaders: true,
            resultOrder: 'windows-first',
        },
    },
    {
        id: 'ulauncher',
        title: 'Ulauncher',
        description: 'Alfred-like dark panel with larger icons',
        hint: 'Search',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: false,
            resultOrder: 'default',
        },
    },
    {
        id: 'krunner',
        title: 'KRunner',
        description: 'Plasma-style compact bar anchored near the top',
        hint: 'Search or run',
        look: {
            position: 'top',
            density: 'compact',
            showNumbers: false,
            showHeaders: false,
            resultOrder: 'default',
        },
    },
    {
        id: 'gnome',
        title: 'GNOME',
        description: 'Adwaita-styled card that matches the shell',
        hint: 'Type to search',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: true,
            resultOrder: 'default',
        },
    },
];

export function getTheme(id) {
    for (const theme of THEMES) {
        if (theme.id === id)
            return theme;
    }
    return THEMES[0];
}

export function getThemeIds() {
    return THEMES.map(theme => theme.id);
}

export function applyLookSettings(settings, theme) {
    const look = theme.look;
    settings.set_string('popup-position', look.position);
    settings.set_string('row-density', look.density);
    settings.set_boolean('show-result-numbers', look.showNumbers);
    settings.set_boolean('show-section-headers', look.showHeaders);
    settings.set_string('result-order', look.resultOrder);
}
