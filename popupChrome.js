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

export const OSK_POPOVER_STYLE = 'keyboard-subkeys-boxpointer';

export function actorHasStyleClass(actor, name) {
    if (!actor || !name)
        return false;
    if (typeof actor.has_style_class_name === 'function')
        return Boolean(actor.has_style_class_name(name));
    const style = actor.style_class;
    if (typeof style !== 'string' || !style)
        return false;
    return style.split(/\s+/).includes(name);
}

// gnome 50 keeps accent popovers in addtopchrome after first use
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/keyboard.js
export function isOskPopoverActor(actor) {
    return actorHasStyleClass(actor, OSK_POPOVER_STYLE);
}

export function shouldWatchOskPopover(actor, tracked) {
    if (!isOskPopoverActor(actor))
        return false;
    if (tracked && tracked.includes(actor))
        return false;
    return true;
}

export function uiGroupChildren(uiGroup) {
    if (!uiGroup || typeof uiGroup.get_children !== 'function')
        return [];
    const kids = uiGroup.get_children();
    return Array.isArray(kids) ? kids : [];
}

export function oskChromeToRaise(uiGroup, keyboardBox, popup) {
    const actors = [];
    if (keyboardBox)
        actors.push(keyboardBox);
    for (const child of uiGroupChildren(uiGroup)) {
        if (child === keyboardBox || child === popup)
            continue;
        if (isOskPopoverActor(child))
            actors.push(child);
    }
    return actors;
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

// raise keys first then accents so a reused boxpointer is not buried
export function raiseOskChrome(uiGroup, keyboardBox, popup) {
    let raised = false;
    let sibling = popup;
    for (const actor of oskChromeToRaise(uiGroup, keyboardBox, popup)) {
        if (!raiseChromeAbove(uiGroup, actor, sibling))
            continue;
        raised = true;
        sibling = actor;
    }
    return raised;
}
