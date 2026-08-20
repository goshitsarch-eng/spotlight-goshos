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
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 28,
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
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 24,
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
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'windows-first',
            iconSize: 36,
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
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 40,
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
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 20,
        },
    },
    {
        id: 'gnome',
        title: 'GNOME',
        description: 'Adwaita-styled card that follows the session accent on GNOME 47+',
        hint: 'Type to search',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: true,
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 28,
        },
    },
    {
        id: 'rofi',
        title: 'Rofi',
        description: 'dmenu-style list with the classic teal selection bar',
        hint: 'Filter',
        look: {
            position: 'center',
            density: 'compact',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: false,
            showResultIcons: false,
            showDescriptions: false,
            resultOrder: 'default',
            iconSize: 22,
        },
    },
    {
        id: 'raycast',
        title: 'Raycast',
        description: 'Dark rounded panel with a red caret and no section headers',
        hint: 'Search for apps and commands...',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 32,
        },
    },
    {
        id: 'albert',
        title: 'Albert',
        description: 'Breeze-dark card with a Plasma-blue selected row',
        hint: 'Enter a query',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: true,
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 26,
        },
    },
    {
        id: 'wofi',
        title: 'Wofi',
        description: 'Wayland dmenu-style list with a steel-blue selected row',
        hint: 'Search',
        look: {
            position: 'center',
            density: 'compact',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: false,
            showResultIcons: false,
            showDescriptions: false,
            resultOrder: 'default',
            iconSize: 22,
        },
    },
    {
        id: 'fuzzel',
        title: 'Fuzzel',
        description: 'Solarized light Wayland launcher with a 10px rounded frame',
        hint: 'Type to search',
        look: {
            position: 'center',
            density: 'compact',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: false,
            showResultIcons: true,
            showDescriptions: false,
            resultOrder: 'default',
            iconSize: 24,
        },
    },
    {
        id: 'anyrun',
        title: 'Anyrun',
        description: 'Catppuccin mocha panel used with the Anyrun Wayland launcher',
        hint: 'Search',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: false,
            showResultIcons: true,
            showDescriptions: false,
            resultOrder: 'default',
            iconSize: 28,
        },
    },
    {
        id: 'tofi',
        title: 'Tofi',
        description: 'Stark dmenu-style bar used by the Tofi Wayland launcher',
        hint: 'Run',
        look: {
            position: 'top',
            density: 'compact',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: false,
            showResultIcons: false,
            showDescriptions: false,
            resultOrder: 'default',
            iconSize: 20,
        },
    },
    {
        id: 'light',
        title: 'Light',
        description: 'Light card that follows the session accent on GNOME 47+',
        hint: 'Type to search',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: true,
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 28,
        },
    },
    {
        id: 'powertoys',
        title: 'PowerToys',
        description: 'Windows-style runner card with a Fluent blue selected row',
        hint: 'Type here to search',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: true,
            resultOrder: 'default',
            iconSize: 32,
        },
    },
    {
        id: 'synapse',
        title: 'Synapse',
        description: 'Large-icon dark panel with an Ubuntu-orange caret',
        hint: 'Search...',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: false,
            resultOrder: 'default',
            iconSize: 48,
        },
    },
    {
        id: 'onagre',
        title: 'Onagre',
        description: 'Centered dark panel with an amber selected row',
        hint: 'Search',
        look: {
            position: 'center',
            density: 'comfortable',
            showNumbers: false,
            showHeaders: false,
            showSearchIcon: true,
            showResultIcons: true,
            showDescriptions: false,
            resultOrder: 'default',
            iconSize: 30,
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

export function shouldApplyLook(previousId, nextId) {
    return Boolean(nextId) && nextId !== previousId;
}

// a gsettings look write while disabled never reaches the popup listener
// first enable of the default look only stamps so a custom icon size lives
// a non-default look written before the first enable still needs its chrome
export function lookApplyAction(themeId, appliedId) {
    if (!themeId)
        return 'keep';
    if (!appliedId)
        return themeId === THEMES[0].id ? 'stamp' : 'apply';
    if (themeId !== appliedId)
        return 'apply';
    return 'keep';
}

export function applyLookSettings(settings, theme) {
    const look = theme.look;
    settings.set_string('popup-position', look.position);
    settings.set_string('row-density', look.density);
    settings.set_boolean('show-result-numbers', look.showNumbers);
    settings.set_boolean('show-section-headers', look.showHeaders);
    settings.set_boolean('show-search-icon', look.showSearchIcon);
    settings.set_boolean('show-result-icons', look.showResultIcons);
    settings.set_boolean('show-descriptions', look.showDescriptions);
    settings.set_string('result-order', look.resultOrder);
    settings.set_int('icon-size', look.iconSize);
    settings.set_string('applied-look', theme.id);
}

export function syncLookSettings(settings) {
    const theme = getTheme(settings.get_string('launcher-theme'));
    const action = lookApplyAction(theme.id, settings.get_string('applied-look'));
    if (action === 'apply')
        applyLookSettings(settings, theme);
    else if (action === 'stamp')
        settings.set_string('applied-look', theme.id);
    return action;
}

// compact density shrinks the look's own icon size so popos stays larger
// than krunner even when both are set to compact
export function iconSizeForLook(look, density) {
    if (density === 'compact')
        return Math.round(look.iconSize * 0.8);
    return look.iconSize;
}
