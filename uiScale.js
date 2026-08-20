// gosh is launcher - st css px versus clutter allocation
// SPDX-License-Identifier: GPL-3.0-or-later

// st multiplies stylesheet px by the theme scale factor
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/src/st/st-theme-node.c
// set_width is stage pixels so a 600 setting must be scaled or hidpi
// sessions get a half-width popup and a css max-height that overflows

export function themeScale(scale) {
    if (typeof scale !== 'number' || !(scale > 0))
        return 1;
    return scale;
}

export function stagePx(logical, scale) {
    return Math.round(logical * themeScale(scale));
}

export function cssPx(stage, scale) {
    return Math.round(stage / themeScale(scale));
}
