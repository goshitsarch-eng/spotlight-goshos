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
        defaultPosition: 'center',
        hint: 'Search apps...',
    },
    {
        id: 'omarchy',
        title: 'Omarchy',
        description: 'Walker-style Tokyo Night panel used by Omarchy Linux',
        defaultPosition: 'center',
        hint: 'Search...',
    },
    {
        id: 'popos',
        title: 'Pop!_OS',
        description: 'COSMIC launcher look with a single card and roomy rows',
        defaultPosition: 'top',
        hint: 'Type to search',
    },
    {
        id: 'ulauncher',
        title: 'Ulauncher',
        description: 'Alfred-like dark panel with larger icons',
        defaultPosition: 'center',
        hint: 'Search',
    },
    {
        id: 'krunner',
        title: 'KRunner',
        description: 'Plasma-style compact bar anchored near the top',
        defaultPosition: 'top',
        hint: 'Search or run',
    },
    {
        id: 'gnome',
        title: 'GNOME',
        description: 'Adwaita-styled card that matches the shell',
        defaultPosition: 'center',
        hint: 'Type to search',
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
