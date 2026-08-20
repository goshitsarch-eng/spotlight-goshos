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

// control plus these letters move the selection they still type without it
export function resolveCtrlNav(key) {
    const name = key.toLowerCase();
    if (name === 'j' || name === 'n')
        return {type: 'move', delta: 1};
    if (name === 'k' || name === 'p')
        return {type: 'move', delta: -1};
    return null;
}

// clutter.text uses -1 for the caret at the end
export function cursorAtStart(cursor) {
    return cursor === 0;
}

export function cursorAtEnd(cursor, textLength) {
    return textLength === 0 || cursor < 0 || cursor >= textLength;
}

// home/end edit the query unless the caret is already at that edge
export function resolveHomeEndAction(key, cursor, textLength) {
    if (key === 'Home') {
        if (cursorAtStart(cursor))
            return {type: 'move', delta: -999};
        return {type: 'propagate'};
    }
    if (key === 'End') {
        if (cursorAtEnd(cursor, textLength))
            return {type: 'move', delta: 999};
        return {type: 'propagate'};
    }
    return null;
}

export function isNavAction(type) {
    return type === 'close' || type === 'move' || type === 'activate' ||
           type === 'activate-index';
}
