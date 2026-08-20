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
