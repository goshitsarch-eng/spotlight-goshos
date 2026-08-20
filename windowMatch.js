// gosh is launcher - whether an open window matches a query
// SPDX-License-Identifier: GPL-3.0-or-later

import {textMatchesQuery} from './wordMatch.js';

export function shouldListWindow(hasWorkspace, skipTaskbar, type, listedTypes) {
    if (!hasWorkspace || skipTaskbar)
        return false;
    for (const listed of listedTypes) {
        if (type === listed)
            return true;
    }
    return false;
}

export function windowMatches(title, wmClass, query, workspaceLabel) {
    if (query.length === 0)
        return true;
    if (textMatchesQuery(title, query) || textMatchesQuery(wmClass, query))
        return true;
    return Boolean(workspaceLabel) && textMatchesQuery(workspaceLabel, query);
}

// mutter workspace.index is 0-based launchers show Workspace 1
export function windowWorkspaceLabel(index, onAllWorkspaces) {
    if (onAllWorkspaces)
        return 'On all workspaces';
    if (!Number.isInteger(index) || index < 0)
        return 'Switch to window';
    return `Workspace ${index + 1}`;
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

// compositor list order is stacking not focus
export function sortWindowsMostRecent(windows, getUserTime) {
    return windows.slice().sort((a, b) => getUserTime(b) - getUserTime(a));
}
