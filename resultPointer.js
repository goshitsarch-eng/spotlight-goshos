// gosh is launcher - result row press must stay on the same row
// SPDX-License-Identifier: GPL-3.0-or-later

export const PRIMARY_BUTTON = 1;

export function rowPointerAction(phase, button, wasPressed) {
    if (phase === 'leave')
        return {pressed: false, action: 'propagate'};
    if (button !== PRIMARY_BUTTON)
        return {pressed: wasPressed, action: 'propagate'};
    if (phase === 'press')
        return {pressed: true, action: 'stop'};
    if (phase === 'release' && wasPressed)
        return {pressed: false, action: 'activate'};
    return {pressed: false, action: 'propagate'};
}
