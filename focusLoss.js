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

// alt-tab closes a click on a row or scrollbar must return to the entry
export function focusLossAction(hasFocus, isStage, popupContainsFocus, focusIsEntry) {
    if (!hasFocus || isStage)
        return 'ignore';
    if (!popupContainsFocus)
        return 'close';
    if (!focusIsEntry)
        return 'refocus-entry';
    return 'ignore';
}

// grab_key_focus inside notify::key-focus or button-release aborts clutter 18
export function shouldRunRefocus(isOpen, visible) {
    return Boolean(isOpen && visible);
}
