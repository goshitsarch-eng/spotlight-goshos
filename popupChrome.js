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

// addtopchrome after shell init sits above the parked keyboardbox
// raise the keys while they are visible so taps do not hit our backdrop
export function shouldRaiseChromeAbove(uiGroup, actor, sibling) {
    if (!uiGroup || !actor || !sibling)
        return false;
    if (typeof uiGroup.set_child_above_sibling !== 'function')
        return false;
    if (actor === sibling)
        return false;
    if (!actor.visible)
        return false;
    if (actor.get_parent() !== uiGroup || sibling.get_parent() !== uiGroup)
        return false;
    return true;
}

export function raiseChromeAbove(uiGroup, actor, sibling) {
    if (!shouldRaiseChromeAbove(uiGroup, actor, sibling))
        return false;
    try {
        uiGroup.set_child_above_sibling(actor, sibling);
        return true;
    } catch (e) {
        return false;
    }
}
