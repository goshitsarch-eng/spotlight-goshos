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
export const IME_CANDIDATE_STYLE = 'candidate-popup-boxpointer';

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

export function actorOrAncestorHasStyleClass(actor, name, maxDepth) {
    let current = actor;
    let depth = 0;
    const limit = maxDepth === undefined ? 8 : maxDepth;
    while (current && depth < limit) {
        if (actorHasStyleClass(current, name))
            return true;
        current = typeof current.get_parent === 'function' ? current.get_parent() : null;
        depth += 1;
    }
    return false;
}

// gnome 50 keeps accent popovers in addtopchrome after first use
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/keyboard.js
export function isOskPopoverActor(actor) {
    return actorHasStyleClass(actor, OSK_POPOVER_STYLE);
}

// ibus candidates are addtopchrome at init and only raise above keyboardbox
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/ibusCandidatePopup.js
export function isImeCandidateActor(actor) {
    return actorHasStyleClass(actor, IME_CANDIDATE_STYLE);
}

export function isInputChromeActor(actor) {
    return isOskPopoverActor(actor) || isImeCandidateActor(actor);
}

export function shouldWatchInputChrome(actor, tracked) {
    if (!isInputChromeActor(actor))
        return false;
    if (tracked && tracked.includes(actor))
        return false;
    return true;
}

export function shouldWatchOskPopover(actor, tracked) {
    return shouldWatchInputChrome(actor, tracked);
}

export function imeCandidateVisible(uiGroup) {
    for (const child of uiGroupChildren(uiGroup)) {
        if (isImeCandidateActor(child) && child.visible)
            return true;
    }
    return false;
}

export function uiGroupChildren(uiGroup) {
    if (!uiGroup || typeof uiGroup.get_children !== 'function')
        return [];
    const kids = uiGroup.get_children();
    return Array.isArray(kids) ? kids : [];
}

export function inputChromeToRaise(uiGroup, keyboardBox, popup) {
    const actors = [];
    if (keyboardBox)
        actors.push(keyboardBox);
    const accents = [];
    const candidates = [];
    for (const child of uiGroupChildren(uiGroup)) {
        if (child === keyboardBox || child === popup)
            continue;
        if (isOskPopoverActor(child))
            accents.push(child);
        else if (isImeCandidateActor(child))
            candidates.push(child);
    }
    return actors.concat(accents, candidates);
}

export function oskChromeToRaise(uiGroup, keyboardBox, popup) {
    return inputChromeToRaise(uiGroup, keyboardBox, popup);
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

// candidate open() then raises above keyboardbox which sits under us
// an idle raise runs after that sibling move
export function shouldScheduleInputChromeRaise(hasPendingIdle, isOpen) {
    return Boolean(isOpen) && !hasPendingIdle;
}

// update-lookup-table restacks an already-visible popup
export function shouldRaiseOnInputChromeAllocation(isOpen, actorVisible) {
    return Boolean(isOpen && actorVisible);
}

// raise keys then accents then ibus candidates so later addtopchrome
// cannot bury input chrome under the backdrop
export function raiseInputChrome(uiGroup, keyboardBox, popup) {
    let raised = false;
    let sibling = popup;
    for (const actor of inputChromeToRaise(uiGroup, keyboardBox, popup)) {
        if (!raiseChromeAbove(uiGroup, actor, sibling))
            continue;
        raised = true;
        sibling = actor;
    }
    return raised;
}

export function raiseOskChrome(uiGroup, keyboardBox, popup) {
    return raiseInputChrome(uiGroup, keyboardBox, popup);
}
