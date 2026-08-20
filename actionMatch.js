// gosh is launcher - system action query matching
// SPDX-License-Identifier: GPL-3.0-or-later

import {wordPrefixMatch} from './wordMatch.js';

export function normalizeActionQuery(query) {
    return query.toLowerCase()
        .replace(/\b(the|a|an|my|please|computer|system|session|machine|pc|of|now)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function actionMatchesQuery(action, query) {
    const lowerQuery = normalizeActionQuery(query);
    if (lowerQuery.length === 0)
        return false;
    const title = action.title.toLowerCase();
    if (title.startsWith(lowerQuery) || wordPrefixMatch(title, lowerQuery))
        return true;
    if (lowerQuery.length >= 3 && title.includes(lowerQuery))
        return true;
    for (const keyword of action.keywords) {
        const kw = keyword.toLowerCase();
        if (kw.startsWith(lowerQuery) || kw === lowerQuery)
            return true;
        if (lowerQuery.length >= 3 && kw.includes(lowerQuery))
            return true;
    }
    return false;
}
