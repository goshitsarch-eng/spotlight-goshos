// gosh is launcher - session accent for the gnome and light looks
// SPDX-License-Identifier: GPL-3.0-or-later

// gnome 47 added accent-color as an enum on org.gnome.desktop.interface
// https://gitlab.gnome.org/GNOME/gsettings-desktop-schemas/-/blob/gnome-47/headers/gdesktop-enums.h
export const ACCENT_NICKS = [
    'blue',
    'teal',
    'green',
    'yellow',
    'orange',
    'red',
    'pink',
    'purple',
    'slate',
];

export const ACCENT_HEX = {
    blue: '#3584e4',
    teal: '#2190a4',
    green: '#3a944a',
    yellow: '#c88800',
    orange: '#ed5b00',
    red: '#e62d42',
    pink: '#d56199',
    purple: '#9141ac',
    slate: '#6f8396',
};

export function accentNickFromEnum(value) {
    if (typeof value !== 'number' || value < 0 || value >= ACCENT_NICKS.length)
        return 'blue';
    return ACCENT_NICKS[value];
}

export function accentNickFromSettings(hasKey, enumValue) {
    if (!hasKey)
        return 'blue';
    return accentNickFromEnum(enumValue);
}

export function accentHex(nick) {
    return ACCENT_HEX[nick] || ACCENT_HEX.blue;
}

// blue is the stylesheet default so the class is only needed for the others
export function accentStyleClass(themeId, nick) {
    if (themeId !== 'gnome' && themeId !== 'light')
        return '';
    if (!nick || nick === 'blue')
        return '';
    return `gosh-accent-${nick}`;
}

export function schemaHasAccentKey(schema) {
    if (!schema || typeof schema.has_key !== 'function')
        return false;
    return schema.has_key('accent-color');
}
