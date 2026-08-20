// gosh is launcher - system action query matching
// SPDX-License-Identifier: GPL-3.0-or-later

export function actionMatchesQuery(action, query) {
    const lowerQuery = query.toLowerCase();
    if (action.title.toLowerCase().includes(lowerQuery))
        return true;
    return action.keywords.some(kw => {
        const k = kw.toLowerCase();
        return k.includes(lowerQuery) || lowerQuery.includes(k);
    });
}
