// gosh is launcher - web search engine catalog
// SPDX-License-Identifier: GPL-3.0-or-later

// shared by the shell provider and the prefs combo so labels stay in sync
export const SEARCH_ENGINES = [
    {id: 'google', label: 'Google', url: 'https://www.google.com/search?q='},
    {id: 'duckduckgo', label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q='},
    {id: 'brave', label: 'Brave', url: 'https://search.brave.com/search?q='},
    {id: 'bing', label: 'Bing', url: 'https://www.bing.com/search?q='},
    {id: 'startpage', label: 'Startpage', url: 'https://www.startpage.com/do/search?q='},
    {id: 'ecosia', label: 'Ecosia', url: 'https://www.ecosia.org/search?q='},
    {id: 'qwant', label: 'Qwant', url: 'https://www.qwant.com/?q='},
    {id: 'kagi', label: 'Kagi', url: 'https://kagi.com/search?q='},
    {id: 'wikipedia', label: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?search='},
];

export function enginePrefsSearchText() {
    return SEARCH_ENGINES.map(engine => engine.label).join(', ');
}

export function getEngine(id) {
    for (const engine of SEARCH_ENGINES) {
        if (engine.id === id)
            return engine;
    }
    return SEARCH_ENGINES[0];
}
