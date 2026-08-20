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
