// gosh is launcher - map a key press to a popup action
// SPDX-License-Identifier: GPL-3.0-or-later

// pure so keyboard behavior can be tested without clutter
export function resolveKeyAction(key, shift, alt, showNumbers) {
    if (showNumbers && alt) {
        const digit = Number(key);
        if (digit >= 1 && digit <= 9)
            return {type: 'activate-index', index: digit - 1};
    }

    if (key === 'Escape')
        return {type: 'close'};
    if (key === 'Down')
        return {type: 'move', delta: 1};
    if (key === 'Tab')
        return {type: 'move', delta: shift ? -1 : 1};
    if (key === 'Up' || key === 'ISO_Left_Tab')
        return {type: 'move', delta: -1};
    if (key === 'Page_Down')
        return {type: 'move', delta: 5};
    if (key === 'Page_Up')
        return {type: 'move', delta: -5};
    if (key === 'Return' || key === 'KP_Enter')
        return {type: 'activate'};
    return {type: 'propagate'};
}

export function isNavAction(type) {
    return type === 'close' || type === 'move' || type === 'activate' ||
           type === 'activate-index';
}
