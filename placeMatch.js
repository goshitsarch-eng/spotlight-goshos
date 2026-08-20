// gosh is launcher - xdg user folder matching
// SPDX-License-Identifier: GPL-3.0-or-later

import {wordPrefixMatch, keywordMatchesQuery} from './wordMatch.js';

export const PLACE_CATALOG = [
    {id: 'home', title: 'Home', keywords: ['home', '~'], icon: 'user-home-symbolic'},
    {id: 'desktop', title: 'Desktop', keywords: ['desktop'], icon: 'user-desktop-symbolic'},
    {id: 'documents', title: 'Documents', keywords: ['documents', 'docs'], icon: 'folder-documents-symbolic'},
    {id: 'download', title: 'Downloads', keywords: ['downloads', 'download'], icon: 'folder-download-symbolic'},
    {id: 'music', title: 'Music', keywords: ['music', 'audio'], icon: 'folder-music-symbolic'},
    {id: 'pictures', title: 'Pictures', keywords: ['pictures', 'photos', 'images'], icon: 'folder-pictures-symbolic'},
    {id: 'videos', title: 'Videos', keywords: ['videos', 'movies'], icon: 'folder-videos-symbolic'},
    {id: 'public', title: 'Public', keywords: ['public', 'share'], icon: 'folder-publicshare-symbolic'},
    {id: 'templates', title: 'Templates', keywords: ['templates'], icon: 'folder-templates-symbolic'},
];

// a one letter query must be a prefix so o does not list every folder
// that happens to contain the letter
export function placeMatches(title, keywords, query) {
    if (query.length === 0)
        return false;
    const q = query.toLowerCase();
    const titleLower = title.toLowerCase();
    if (titleLower.startsWith(q) || wordPrefixMatch(titleLower, q))
        return true;
    if (q.length >= 3 && titleLower.includes(q))
        return true;
    for (const keyword of keywords) {
        if (keywordMatchesQuery(keyword, q))
            return true;
    }
    return false;
}

export function matchPlaces(query) {
    const results = [];
    for (const place of PLACE_CATALOG) {
        if (!placeMatches(place.title, place.keywords, query))
            continue;
        results.push(place);
    }
    return results;
}

// unset xdg dirs often fall back to the same home path
export function takeUniquePlaces(places, getPath, maxResults) {
    if (maxResults <= 0)
        return [];
    const seen = new Set();
    const unique = [];
    for (const place of places) {
        const path = getPath(place.id);
        if (!path || seen.has(path))
            continue;
        seen.add(path);
        unique.push({place, path});
        if (unique.length >= maxResults)
            break;
    }
    return unique;
}
