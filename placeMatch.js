// gosh is launcher - xdg user folder matching
// SPDX-License-Identifier: GPL-3.0-or-later

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

export function placeMatches(title, keywords, query) {
    if (query.length === 0)
        return false;
    const q = query.toLowerCase();
    if (title.toLowerCase().includes(q))
        return true;
    for (const keyword of keywords) {
        if (keyword.includes(q))
            return true;
    }
    return false;
}

export function matchPlaces(query, maxResults) {
    const results = [];
    for (const place of PLACE_CATALOG) {
        if (!placeMatches(place.title, place.keywords, query))
            continue;
        results.push(place);
        if (results.length >= maxResults)
            break;
    }
    return results;
}
