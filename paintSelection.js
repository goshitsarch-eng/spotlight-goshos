// gosh is launcher - keep the selected row across an async repaint
// SPDX-License-Identifier: GPL-3.0-or-later

export function resultSelectionKey(result, index) {
    if (!result)
        return null;
    return {
        type: result.type,
        title: result.title,
        description: result.description || '',
        id: result.id,
        index,
    };
}

export function firstSelectableIndex(results) {
    if (!results.length)
        return -1;
    for (let i = 0; i < results.length; i++) {
        if (results[i].activatable !== false)
            return i;
    }
    return 0;
}

export function paintSelectionIndex(previous, results) {
    if (!results.length)
        return -1;
    if (!previous)
        return firstSelectableIndex(results);
    if (previous.id !== undefined && previous.id !== null && previous.id !== '') {
        for (let i = 0; i < results.length; i++) {
            if (results[i].id === previous.id)
                return i;
        }
    }
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
    return firstSelectableIndex(results);
}
