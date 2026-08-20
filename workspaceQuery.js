// gosh is launcher - workspace switch queries
// SPDX-License-Identifier: GPL-3.0-or-later

import {replaceNumberWords} from './numberWords.js';

export function parseWorkspaceSwitchQuery(query) {
    const text = replaceNumberWords(query.trim());
    const match = /^(?:(?:go to|switch to|move to)\s+)?(?:workspace|ws)\s+(\d+)$/i.exec(text);
    if (!match)
        return null;

    const number = Number(match[1]);
    if (!Number.isInteger(number) || number < 1)
        return null;

    return {
        index: number - 1,
        number,
    };
}

export function workspaceSwitchTitle(number) {
    return `Switch to Workspace ${number}`;
}

export function workspaceResultId(number) {
    return `workspace:${number}`;
}

export function workspaceIndexInRange(index, workspaceCount) {
    return Number.isInteger(index) && index >= 0 && index < workspaceCount;
}
