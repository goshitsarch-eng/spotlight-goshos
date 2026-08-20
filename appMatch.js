// gosh is launcher - app name generic-name and keyword match tiers
// SPDX-License-Identifier: GPL-3.0-or-later

import {wordPrefixMatch, keywordMatchesQuery, SUBSTRING_MIN, idMatchesQuery, labelMatchesQuery} from './wordMatch.js';

// strip a known trailing variant so firefox and firefox esr collapse
// do not split on every hyphen or gnome-builder becomes gnome
export function appRowDescription(windowCount) {
    if (windowCount > 0)
        return 'Switch to application';
    return 'Application';
}

export function appBaseName(name) {
    return name.toLowerCase()
        .replace(/[\s-]+(esr|beta|nightly|dev|canary|stable|preview)$/, '')
        .trim();
}

// sort first then keep the winner so usage beats install order
export function takeUniqueByBaseName(items, getName, maxResults) {
    if (maxResults <= 0)
        return [];

    const seen = new Set();
    const unique = [];
    for (const item of items) {
        const baseName = appBaseName(getName(item));
        if (seen.has(baseName))
            continue;
        seen.add(baseName);
        unique.push(item);
        if (unique.length >= maxResults)
            break;
    }
    return unique;
}

// lower tier is a better match so a name prefix still beats a keyword hit
// generic-name and keywords are how overview finds firefox from browser
export function appMatchTier(name, genericName, id, keywords, query, description) {
    if (query.length === 0)
        return -1;

    const q = query.toLowerCase();
    const nameLower = name.toLowerCase();
    const genericLower = genericName.toLowerCase();
    const idLower = id.replace(/\.desktop$/i, '').toLowerCase();
    const descLower = (description || '').toLowerCase();

    if (nameLower.startsWith(q))
        return 0;
    if (wordPrefixMatch(nameLower, q))
        return 1;
    if (q.length >= SUBSTRING_MIN && nameLower.includes(q))
        return 2;
    if (labelMatchesQuery(genericLower, q))
        return 3;
    if (idMatchesQuery(idLower, q))
        return 4;
    for (const keyword of keywords) {
        if (keywordMatchesQuery(keyword, q))
            return 5;
    }
    if (q.length >= SUBSTRING_MIN && labelMatchesQuery(descLower, q))
        return 6;

    const words = q.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2)
        return -1;

    // chrome browser is a name plus a generic-name not one phrase
    let worst = 0;
    for (const word of words) {
        const tier = _tokenTier(nameLower, genericLower, idLower, keywords, descLower, word);
        if (tier < 0)
            return -1;
        if (tier > worst)
            worst = tier;
    }
    return 7 + worst;
}

function _tokenTier(nameLower, genericLower, idLower, keywords, descLower, token) {
    if (nameLower.startsWith(token))
        return 0;
    if (wordPrefixMatch(nameLower, token))
        return 1;
    if (token.length >= SUBSTRING_MIN && nameLower.includes(token))
        return 2;
    if (labelMatchesQuery(genericLower, token))
        return 3;
    if (idMatchesQuery(idLower, token))
        return 4;
    for (const keyword of keywords) {
        if (keywordMatchesQuery(keyword, token))
            return 5;
    }
    if (token.length >= SUBSTRING_MIN && labelMatchesQuery(descLower, token))
        return 6;
    return -1;
}
