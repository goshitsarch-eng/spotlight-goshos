// gosh is launcher - system action query matching
// SPDX-License-Identifier: GPL-3.0-or-later

import {wordPrefixMatch} from './wordMatch.js';

export function actionMatchesQuery(action, query) {
    const lowerQuery = query.toLowerCase();
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
