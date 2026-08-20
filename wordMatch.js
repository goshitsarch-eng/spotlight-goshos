// gosh is launcher - gnome-style word prefix matching
// SPDX-License-Identifier: GPL-3.0-or-later

// word boundaries are space hyphen underscore dot and slash
// slash so doc matches ~/Documents without ome matching /home
export const SUBSTRING_MIN = 3;

export function textMatchesQuery(text, query) {
    if (query.length === 0)
        return false;
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    if (t.startsWith(q) || wordPrefixMatch(t, q))
        return true;
    return q.length >= SUBSTRING_MIN && t.includes(q);
}

// chrome browser is two fields not one phrase
export function textMatchesAllWords(text, query) {
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2)
        return false;
    return words.every(word => textMatchesQuery(text, word));
}

// keywords are labels not haystacks so row must not hit browser
export function keywordMatchesQuery(keyword, query) {
    if (!keyword || !query)
        return false;
    const kw = keyword.toLowerCase();
    const q = query.toLowerCase();
    if (kw.startsWith(q) || kw === q || wordPrefixMatch(kw, q))
        return true;
    const nkw = kw.replace(/[-_\s]/g, '');
    const nq = q.replace(/[-_\s]/g, '');
    return nq.length > 0 && nkw.startsWith(nq);
}

// ~/Documents matches doc after the slash not ome inside home
export function pathMatchesQuery(path, query) {
    if (!path || !query)
        return false;
    const p = path.toLowerCase();
    const q = query.toLowerCase();
    return p.startsWith(q) || wordPrefixMatch(p, q);
}

// generic-name and comments are phrases not haystacks so ows is not browser
export function labelMatchesQuery(text, query) {
    if (!text || !query)
        return false;
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    return t.startsWith(q) || wordPrefixMatch(t, q);
}

// reverse-dns ids must not match org or com as a prefix of the whole id
export function idMatchesQuery(id, query) {
    if (!id || !query)
        return false;
    const q = query.toLowerCase();
    if (q.length < SUBSTRING_MIN)
        return false;

    for (const token of id.toLowerCase().split(/\s+/)) {
        if (!token)
            continue;
        if (wordPrefixMatch(token, q))
            return true;
        const last = token.split('.').pop();
        if (last.startsWith(q))
            return true;
    }

    return false;
}

export function wordPrefixMatch(nameLower, queryLower) {
    const len = queryLower.length;
    if (len === 0)
        return false;

    for (let i = 0; i < nameLower.length - len; i++) {
        const c = nameLower[i];
        if (c === ' ' || c === '-' || c === '_' || c === '.' || c === '/') {
            if (nameLower.substring(i + 1, i + 1 + len) === queryLower)
                return true;
        }
    }

    return false;
}
