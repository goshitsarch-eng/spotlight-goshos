// gosh is launcher - whether a shortcut should open or close
// SPDX-License-Identifier: GPL-3.0-or-later

// gnome 50 TimeLimitsState.LIMIT_REACHED
export const TIME_LIMITS_REACHED = 2;

export function sessionLimitsReached(state) {
    return state === TIME_LIMITS_REACHED;
}

export function timeLimitsState(manager) {
    if (!manager)
        return 0;
    return manager.state;
}

// lock screen greeter and a reached screen-time limit must not launch apps
export function canOpenPopup(isOpen, visible, locked, greeter, limitsReached) {
    return !isOpen && !visible && !locked && !greeter && !limitsReached;
}

// an already-open popup must die when the session locks
export function shouldCloseOnSession(locked, greeter, limitsReached) {
    return locked || greeter || Boolean(limitsReached);
}

// _isOpen covers the idle gap before visible becomes true
export function shouldCloseOnToggle(isOpen, visible) {
    return isOpen || visible;
}

// a second press while closeSoon is pending means reopen after teardown
export function nextReopenAfterClose(closePending, reopenAfterClose) {
    if (!closePending)
        return false;
    return !reopenAfterClose;
}

// clutter 18 aborts if addchrome runs inside the accelerator callback
export function nextToggleAction(isOpen, visible, openPending, closePending) {
    if (closePending)
        return 'toggle-reopen';
    if (openPending)
        return 'cancel-open';
    if (isOpen || visible)
        return 'close';
    return 'open';
}
