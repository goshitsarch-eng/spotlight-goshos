// gosh is launcher - parse recently-used.xbel text
// SPDX-License-Identifier: GPL-3.0-or-later

const HREF_RE = /href\s*=\s*["'](file:[^"']+)["']/g;

function unescapeXml(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

// xbel is xml so only file: hrefs are launcher results
// web bookmarks in the same file are ignored
export function parseRecentXbel(text) {
    if (text.length === 0)
        return [];

    const uris = [];
    const seen = new Set();
    HREF_RE.lastIndex = 0;
    let match = HREF_RE.exec(text);
    while (match !== null) {
        const uri = unescapeXml(match[1]);
        match = HREF_RE.exec(text);
        if (seen.has(uri))
            continue;
        seen.add(uri);
        uris.push(uri);
    }
    return uris;
}

export function basenameFromUri(uri) {
    const parts = uri.split('/');
    const raw = parts[parts.length - 1] || uri;
    // turn lone % into %25 so decodeURIComponent cannot throw
    const safe = raw.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
    return decodeURIComponent(safe);
}
