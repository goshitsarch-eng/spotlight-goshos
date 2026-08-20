// gosh is launcher - app name generic-name and keyword match tiers
// SPDX-License-Identifier: GPL-3.0-or-later

import {wordPrefixMatch} from './wordMatch.js';

// strip a known trailing variant so firefox and firefox esr collapse
// do not split on every hyphen or gnome-builder becomes gnome
export function appBaseName(name) {
    return name.toLowerCase()
        .replace(/[\s-]+(esr|beta|nightly|dev|canary|stable|preview)$/, '')
        .trim();
}

// lower tier is a better match so a name prefix still beats a keyword hit
// generic-name and keywords are how overview finds firefox from browser
export function appMatchTier(name, genericName, id, keywords, query) {
    if (query.length === 0)
        return -1;

    const q = query.toLowerCase();
    const nameLower = name.toLowerCase();
    const genericLower = genericName.toLowerCase();
    const idLower = id.replace(/\.desktop$/i, '').toLowerCase();

    if (nameLower.startsWith(q))
        return 0;
    if (wordPrefixMatch(nameLower, q))
        return 1;
    if (nameLower.includes(q))
        return 2;
    if (genericLower.startsWith(q) || wordPrefixMatch(genericLower, q) || genericLower.includes(q))
        return 3;
    if (idLower.includes(q))
        return 4;
    for (const keyword of keywords) {
        if (keyword.toLowerCase().includes(q))
            return 5;
    }
    return -1;
}
