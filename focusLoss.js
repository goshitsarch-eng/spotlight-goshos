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

// gnome 50 osk extended keys grab focus but live in addtopchrome
// keyboard.js ignores that so the osk stays open we must too
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/keyboard.js
export function focusIsOnScreenKeyboard(focus, keyboardBox) {
    if (!focus)
        return false;
    if (focus.extendedKey || focus._extendedKeys)
        return true;
    if (!keyboardBox)
        return false;
    if (focus === keyboardBox)
        return true;
    return typeof keyboardBox.contains === 'function' && keyboardBox.contains(focus);
}

// gnome 48 get_key_focus returns null instead of the stage
// https://gjs.guide/extensions/upgrading/gnome-shell-48.html
// a click on non-focusable chrome does that so return to the entry
// alt-tab moves focus to another actor and still closes
// an osk long-press is not alt-tab
export function focusLossAction(hasFocus, isStage, popupContainsFocus, focusIsEntry, oskContainsFocus) {
    if (!hasFocus || isStage)
        return 'refocus-entry';
    if (oskContainsFocus)
        return 'ignore';
    if (!popupContainsFocus)
        return 'close';
    if (!focusIsEntry)
        return 'refocus-entry';
    return 'ignore';
}

// captured-event is stage-wide skip keys only when another actor owns focus
export function shouldCaptureKeys(visible, hasFocus, isStage, popupContainsFocus, oskContainsFocus) {
    if (!visible)
        return false;
    if (!hasFocus || isStage || oskContainsFocus)
        return true;
    return popupContainsFocus;
}

// grab_key_focus inside notify::key-focus or button-release aborts clutter 18
export function shouldRunRefocus(isOpen, visible) {
    return Boolean(isOpen && visible);
}
