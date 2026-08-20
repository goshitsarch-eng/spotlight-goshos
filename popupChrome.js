// gosh is launcher - chrome stacking above always-on-top windows
// SPDX-License-Identifier: GPL-3.0-or-later

// addchrome keeps the actor below top_window_group so an always-on-top
// window and the on-screen keyboard paint over the launcher
// addtopchrome uses the same track but stacks above those layers
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/layout.js

export function chromeAddMethod(hasTopChrome) {
    return hasTopChrome ? 'addTopChrome' : 'addChrome';
}

export function addPopupChrome(layoutManager, actor) {
    const method = chromeAddMethod(typeof layoutManager.addTopChrome === 'function');
    layoutManager[method](actor);
}

export function removePopupChrome(layoutManager, actor) {
    layoutManager.removeChrome(actor);
}
