// gosh is launcher - selection index math
// SPDX-License-Identifier: GPL-3.0-or-later

export function nextSelectedIndex(current, delta, length) {
    if (length === 0)
        return -1;
    let next = current + delta;
    if (Math.abs(delta) === 1) {
        if (next < 0)
            return length - 1;
        if (next >= length)
            return 0;
        return next;
    }
    if (next < 0)
        return 0;
    if (next >= length)
        return length - 1;
    return next;
}

export function isSelectableResult(result) {
    return Boolean(result) && result.activatable !== false;
}

// arrows wrap across ready rows page and home stay on a ready row
export function nextActivatableIndex(current, delta, results) {
    const length = results.length;
    if (length === 0)
        return -1;

    if (Math.abs(delta) === 1) {
        let next = current;
        for (let i = 0; i < length; i++) {
            next += delta;
            if (next < 0)
                next = length - 1;
            else if (next >= length)
                next = 0;
            if (isSelectableResult(results[next]))
                return next;
        }
        return isSelectableResult(results[current]) ? current : -1;
    }

    let next = nextSelectedIndex(current, delta, length);
    if (next < 0)
        return -1;
    if (isSelectableResult(results[next]))
        return next;

    const step = delta > 0 ? 1 : -1;
    for (let i = next + step; i >= 0 && i < length; i += step) {
        if (isSelectableResult(results[i]))
            return i;
    }
    for (let i = next - step; i >= 0 && i < length; i -= step) {
        if (isSelectableResult(results[i]))
            return i;
    }
    return -1;
}
