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

const SPACE_PREFIXES = {
    '.': true,
    '$': true,
    '#': true,
};

// .bashrc $HOME and #ff0000 are names and colors not prefix modes
export function isPrefixToken(trimmed, prefix) {
    if (trimmed.charAt(0) !== prefix)
        return false;
    if (!SPACE_PREFIXES[prefix])
        return true;
    return trimmed.length === 1 || trimmed.charAt(1) === ' ';
}

export function parseQuery(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0)
        return {mode: 'all', query: ''};

    const prefix = trimmed.charAt(0);
    const mode = PREFIXES[prefix];
    if (!mode || !isPrefixToken(trimmed, prefix))
        return {mode: 'all', query: trimmed};

    return {
        mode,
        query: trimmed.slice(1).trim(),
    };
}
