// gosh is launcher - hold compositor unredirect while the popup is open
// SPDX-License-Identifier: GPL-3.0-or-later

// an unredirected fullscreen window bypasses composition so chrome is invisible
// gnome 50 boxpointer disables unredirect while visible for the same reason
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/boxpointer.js
// gnome 48 moved the helpers onto Meta.Compositor
// https://gjs.guide/extensions/upgrading/gnome-shell-48.html
// disable/enable are a matched pair a lone enable is a mutter assertion

export function unredirectApi(hasCompositorMethod, hasDisplayMethod) {
    if (hasCompositorMethod)
        return 'compositor';
    if (hasDisplayMethod)
        return 'display';
    return '';
}

export function nextUnredirectAction(held, wantHeld, api) {
    if (!api)
        return 'keep';
    if (wantHeld && !held)
        return 'hold';
    if (!wantHeld && held)
        return 'release';
    return 'keep';
}
