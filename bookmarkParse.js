// gosh is launcher - gtk bookmark file parsing
// SPDX-License-Identifier: GPL-3.0-or-later

import {basenameFromUri, pathFromFileUri} from './recentXbel.js';
import {fileUriFromAbsolute, expandHomePath} from './homePath.js';
import {isUnsafeLaunchUri} from './urlMatch.js';
import {wordPrefixMatch} from './wordMatch.js';

export function normalizeBookmarkUri(uri, home) {
    if (!uri)
        return '';
    if (isUnsafeLaunchUri(uri))
        return '';
    if (uri.startsWith('/'))
        return fileUriFromAbsolute(uri);
    if (home && (uri === '~' || uri.startsWith('~/'))) {
        const expanded = expandHomePath(uri, home);
        if (expanded.startsWith('/'))
            return fileUriFromAbsolute(expanded);
    }
    return uri;
}

export function hostFromUri(uri) {
    const match = uri.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/(?:[^/@]+@)?([^/:?#]+)/);
    if (!match)
        return '';
    return match[1];
}

export function bookmarkTitle(uri, label) {
    if (label)
        return label;
    const base = basenameFromUri(uri);
    if (base && base !== uri)
        return base;
    const host = hostFromUri(uri);
    if (host)
        return host;
    return uri;
}

export function bookmarkDescription(uri, home) {
    const path = pathFromFileUri(uri);
    if (path && home && path.startsWith(`${home}/`))
        return `~${path.slice(home.length)}`;
    if (path === home)
        return '~';
    if (path)
        return path;
    return uri;
}

export function parseGtkBookmarks(text, home) {
    const rows = [];
    const seen = new Set();
    const lines = text.split(/\r?\n/);
    for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#'))
            continue;
        const space = line.indexOf(' ');
        const rawUri = space === -1 ? line : line.slice(0, space);
        const uri = normalizeBookmarkUri(rawUri, home);
        const label = space === -1 ? '' : line.slice(space + 1).trim();
        if (!uri || seen.has(uri))
            continue;
        seen.add(uri);
        rows.push({
            uri,
            title: bookmarkTitle(uri, label),
        });
    }
    return rows;
}

export function mergeBookmarkFiles(texts, home) {
    return parseGtkBookmarks(texts.join('\n'), home);
}

export function bookmarkMatches(title, description, query) {
    if (query.length === 0)
        return false;
    const q = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    if (titleLower.startsWith(q) || wordPrefixMatch(titleLower, q))
        return true;
    if (descLower.startsWith(q) || wordPrefixMatch(descLower, q))
        return true;
    if (q.length >= 3 && (titleLower.includes(q) || descLower.includes(q)))
        return true;
    return false;
}

export function matchBookmarks(rows, query, maxResults) {
    if (maxResults <= 0)
        return [];
    const results = [];
    for (const row of rows) {
        if (!bookmarkMatches(row.title, row.description || '', query))
            continue;
        results.push(row);
        if (results.length >= maxResults)
            break;
    }
    return results;
}

export function bookmarkIcon(uri) {
    if (uri.startsWith('file:'))
        return 'folder-symbolic';
    return 'network-server-symbolic';
}
