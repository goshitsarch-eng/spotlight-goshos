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

const EXT_ICONS = {
    pdf: 'x-office-document-symbolic',
    doc: 'x-office-document-symbolic',
    docx: 'x-office-document-symbolic',
    odt: 'x-office-document-symbolic',
    txt: 'text-x-generic-symbolic',
    md: 'text-x-generic-symbolic',
    png: 'image-x-generic-symbolic',
    jpg: 'image-x-generic-symbolic',
    jpeg: 'image-x-generic-symbolic',
    gif: 'image-x-generic-symbolic',
    svg: 'image-x-generic-symbolic',
    webp: 'image-x-generic-symbolic',
    mp3: 'audio-x-generic-symbolic',
    wav: 'audio-x-generic-symbolic',
    flac: 'audio-x-generic-symbolic',
    mp4: 'video-x-generic-symbolic',
    mkv: 'video-x-generic-symbolic',
    webm: 'video-x-generic-symbolic',
    zip: 'package-x-generic-symbolic',
    tar: 'package-x-generic-symbolic',
    gz: 'package-x-generic-symbolic',
    html: 'text-html-symbolic',
    htm: 'text-html-symbolic',
};

export function iconForBasename(name) {
    const dot = name.lastIndexOf('.');
    if (dot < 1 || dot === name.length - 1)
        return 'document-open-recent-symbolic';
    const ext = name.slice(dot + 1).toLowerCase();
    return EXT_ICONS[ext] || 'document-open-recent-symbolic';
}

export function basenameFromUri(uri) {
    const parts = uri.split('/');
    const raw = parts[parts.length - 1] || uri;
    // turn lone % into %25 so decodeURIComponent cannot throw
    const safe = raw.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
    return decodeURIComponent(safe);
}
