// gosh is launcher - keep the selected row across an async repaint
// SPDX-License-Identifier: GPL-3.0-or-later

export function paintSelectionIndex(previous, results) {
    if (!results.length)
        return -1;
    if (!previous)
        return 0;
    for (let i = 0; i < results.length; i++) {
        if (results[i].type !== previous.type || results[i].title !== previous.title)
            continue;
        if (previous.description !== undefined &&
            (results[i].description || '') !== previous.description)
            continue;
        return i;
    }
    if (Number.isInteger(previous.index) && previous.index >= 0 && previous.index < results.length)
        return previous.index;
    return 0;
}
