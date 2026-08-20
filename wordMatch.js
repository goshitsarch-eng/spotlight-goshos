// gosh is launcher - gnome-style word prefix matching
// SPDX-License-Identifier: GPL-3.0-or-later

// word boundaries are space hyphen underscore dot
// this is what makes chro match Google Chrome via the second word
export function wordPrefixMatch(nameLower, queryLower) {
    const len = queryLower.length;
    if (len === 0)
        return false;

    for (let i = 0; i < nameLower.length - len; i++) {
        const c = nameLower[i];
        if (c === ' ' || c === '-' || c === '_' || c === '.') {
            if (nameLower.substring(i + 1, i + 1 + len) === queryLower)
                return true;
        }
    }

    return false;
}
