// gosh is launcher - result row press must stay on the same row
// SPDX-License-Identifier: GPL-3.0-or-later

export const PRIMARY_BUTTON = 1;

export function rowPointerAction(phase, button, wasPressed) {
    if (phase === 'leave')
        return {pressed: false, action: 'propagate'};
    if (phase === 'hold')
        return {pressed: wasPressed, action: wasPressed ? 'stop' : 'propagate'};
    if (button !== PRIMARY_BUTTON)
        return {pressed: wasPressed, action: 'propagate'};
    if (phase === 'press')
        return {pressed: true, action: 'stop'};
    if (phase === 'release' && wasPressed)
        return {pressed: false, action: 'activate'};
    return {pressed: false, action: 'propagate'};
}

// destroy_all_children emits enter on the next row mid-teardown
export function shouldApplyHoverSelection(painting, now, suppressedUntil) {
    return !painting && now >= suppressedUntil;
}

// wayland tablets often send touch-event instead of a synthesized click
export function rowTouchPhase(kind) {
    if (kind === 'touch-begin')
        return 'press';
    if (kind === 'touch-end')
        return 'release';
    if (kind === 'touch-cancel')
        return 'leave';
    if (kind === 'touch-update')
        return 'hold';
    return null;
}

// claiming touch-update stops st.scrollview from panning the list
export const TOUCH_TAP_SLOP = 16;

export function eventCoordY(coords) {
    if (!Array.isArray(coords))
        return null;
    if (typeof coords[2] === 'number')
        return coords[2];
    if (typeof coords[1] === 'number')
        return coords[1];
    return null;
}

export function touchMovedPastSlop(startY, y, slop) {
    if (typeof startY !== 'number' || typeof y !== 'number')
        return false;
    const limit = slop === undefined ? TOUCH_TAP_SLOP : slop;
    return Math.abs(y - startY) > limit;
}

export function shouldIgnorePointerForTouch(isTouchscreen) {
    return Boolean(isTouchscreen);
}

export function rowTouchGestureAction(kind, pressed, dragged) {
    if (kind === 'touch-begin')
        return {pressed: true, dragged: false, action: 'propagate'};
    if (kind === 'touch-cancel')
        return {pressed: false, dragged: false, action: 'propagate'};
    if (kind === 'touch-update')
        return {pressed, dragged, action: 'propagate'};
    if (kind === 'touch-end' && pressed && !dragged)
        return {pressed: false, dragged: false, action: 'activate'};
    return {pressed: false, dragged: false, action: 'propagate'};
}
