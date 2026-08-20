// gosh is launcher - whether a shortcut should open or close
// SPDX-License-Identifier: GPL-3.0-or-later

// lock screen and greeter must not launch apps
export function canOpenPopup(isOpen, visible, locked, greeter) {
    return !isOpen && !visible && !locked && !greeter;
}

// an already-open popup must die when the session locks
export function shouldCloseOnSession(locked, greeter) {
    return locked || greeter;
}

// _isOpen covers the idle gap before visible becomes true
export function shouldCloseOnToggle(isOpen, visible) {
    return isOpen || visible;
}
