// gosh is launcher - whether focus should close or return to the entry
// SPDX-License-Identifier: GPL-3.0-or-later

// rows and chrome must not take clutter focus or later letters miss the entry
export function resultRowShouldFocus() {
    return false;
}

export function popupChromeShouldFocus() {
    return false;
}

export function focusIsSearchEntry(focus, entry) {
    if (!focus || !entry)
        return false;
    if (focus === entry)
        return true;
    return typeof entry.contains === 'function' && entry.contains(focus);
}

// gnome 48 get_key_focus returns null instead of the stage
// https://gjs.guide/extensions/upgrading/gnome-shell-48.html
// a click on non-focusable chrome does that so return to the entry
// alt-tab moves focus to another actor and still closes
export function focusLossAction(hasFocus, isStage, popupContainsFocus, focusIsEntry) {
    if (!hasFocus || isStage)
        return 'refocus-entry';
    if (!popupContainsFocus)
        return 'close';
    if (!focusIsEntry)
        return 'refocus-entry';
    return 'ignore';
}

// captured-event is stage-wide skip keys only when another actor owns focus
export function shouldCaptureKeys(visible, hasFocus, isStage, popupContainsFocus) {
    if (!visible)
        return false;
    if (!hasFocus || isStage)
        return true;
    return popupContainsFocus;
}

// grab_key_focus inside notify::key-focus or button-release aborts clutter 18
export function shouldRunRefocus(isOpen, visible) {
    return Boolean(isOpen && visible);
}
