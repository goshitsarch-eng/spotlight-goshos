// gosh is launcher - whether an open window matches a query
// SPDX-License-Identifier: GPL-3.0-or-later

import {textMatchesQuery, textMatchesAllWords} from './wordMatch.js';

export function shouldListWindow(hasWorkspace, skipTaskbar, type, listedTypes) {
    if (!hasWorkspace || skipTaskbar)
        return false;
    for (const listed of listedTypes) {
        if (type === listed)
            return true;
    }
    return false;
}

// every window shares workspace n so only number queries match the label
export function workspaceLabelMatches(label, query) {
    if (!label || !query)
        return false;
    const q = query.trim().toLowerCase();
    const lower = label.toLowerCase();
    if (lower === 'on all workspaces') {
        if (q === 'sticky' || q === 'all' || q.startsWith('on all') || q.startsWith('all work'))
            return true;
        return false;
    }
    const numbered = /^workspace (\d+)$/.exec(lower);
    if (!numbered)
        return false;
    return q === numbered[1] || q === `workspace ${numbered[1]}` || q === `ws ${numbered[1]}`;
}

export function windowMatches(title, wmClass, query, workspaceLabel) {
    if (query.length === 0)
        return true;
    if (textMatchesQuery(title, query) || textMatchesQuery(wmClass, query))
        return true;
    if (textMatchesAllWords(`${title} ${wmClass}`, query))
        return true;
    return workspaceLabelMatches(workspaceLabel, query);
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

// tabIndex 0 is the alt-tab front window user_time is 0 on some wayland setups
export function windowRecencyValue(tabIndex, tabCount, userTime) {
    if (Number.isInteger(tabIndex) && tabIndex >= 0 && tabCount > tabIndex)
        return (tabCount - tabIndex) * 1e12 + userTime;
    return userTime;
}
