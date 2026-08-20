// gosh is launcher - whether an open window matches a query
// SPDX-License-Identifier: GPL-3.0-or-later

export function shouldListWindow(hasWorkspace, skipTaskbar, type, listedTypes) {
    if (!hasWorkspace || skipTaskbar)
        return false;
    for (const listed of listedTypes) {
        if (type === listed)
            return true;
    }
    return false;
}

export function windowMatches(title, wmClass, query) {
    if (query.length === 0)
        return true;
    const q = query.toLowerCase();
    return title.toLowerCase().includes(q) || wmClass.toLowerCase().includes(q);
}

export function windowClassText(wmClass, wmInstance, sandboxedId) {
    const parts = [];
    if (wmClass)
        parts.push(wmClass);
    if (wmInstance)
        parts.push(wmInstance);
    if (sandboxedId)
        parts.push(sandboxedId);
    return parts.join(' ');
}
