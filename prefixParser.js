// gosh is launcher - query prefix parser
// SPDX-License-Identifier: GPL-3.0-or-later

// leading character prefixes force a single provider so users can jump
// straight to calc web settings windows files or a command
export const PREFIXES = {
    '=': 'calculator',
    '@': 'web',
    '#': 'settings',
    '$': 'windows',
    '.': 'files',
    '!': 'command',
};

export function parseQuery(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0)
        return {mode: 'all', query: ''};

    const prefix = trimmed[0];
    const mode = PREFIXES[prefix];
    if (!mode)
        return {mode: 'all', query: trimmed};

    return {
        mode,
        query: trimmed.slice(1).trim(),
    };
}
