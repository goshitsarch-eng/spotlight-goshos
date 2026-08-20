// gosh is launcher - search controller
// SPDX-License-Identifier: GPL-3.0-or-later

import {searchApps, searchFrequentApps} from './appSearch.js';
import {searchCalculator} from './calculatorSearch.js';
import {searchSystemActions} from './systemActionsSearch.js';
import {searchSettings} from './settingsSearch.js';
import {searchWeb} from './webSearch.js';
import {searchWindows} from './windowSearch.js';
import {searchUrl} from './urlSearch.js';
import {searchCommand} from './commandSearch.js';
import {searchRecentFiles} from './recentFilesSearch.js';
import {parseQuery} from './prefixParser.js';

function _engine(settings) {
    return settings.get_string('web-search-engine');
}

function _runMode(mode, query, settings, maxResults) {
    switch (mode) {
    case 'calculator':
        return settings.get_boolean('enable-calculator')
            ? searchCalculator(query) : [];
    case 'web':
        return settings.get_boolean('show-web-search')
            ? searchWeb(query, _engine(settings)) : [];
    case 'settings':
        return settings.get_boolean('enable-settings-search')
            ? searchSettings(query, maxResults) : [];
    case 'windows':
        return settings.get_boolean('enable-window-search')
            ? searchWindows(query, maxResults) : [];
    case 'files':
        return settings.get_boolean('enable-recent-files')
            ? searchRecentFiles(query, maxResults) : [];
    case 'command':
        return settings.get_boolean('enable-command-run')
            ? searchCommand(query) : [];
    default:
        return [];
    }
}

function _runAll(query, settings, maxResults) {
    const results = [];

    if (settings.get_boolean('enable-url-open'))
        results.push(...searchUrl(query));

    if (settings.get_boolean('enable-app-search'))
        results.push(...searchApps(query, maxResults));

    if (settings.get_boolean('enable-calculator'))
        results.push(...searchCalculator(query));

    if (settings.get_boolean('enable-window-search'))
        results.push(...searchWindows(query, maxResults));

    if (settings.get_boolean('enable-system-actions'))
        results.push(...searchSystemActions(query, maxResults));

    if (settings.get_boolean('enable-settings-search'))
        results.push(...searchSettings(query, maxResults));

    if (settings.get_boolean('enable-recent-files'))
        results.push(...searchRecentFiles(query, maxResults));

    if (results.length === 0 && settings.get_boolean('show-web-search'))
        results.push(...searchWeb(query, _engine(settings)));

    return results;
}

// orchestrates all search providers and combines results in priority order
// priority: urls apps calculator windows system settings files then web last
export function runSearch(text, settings) {
    const maxResults = settings.get_int('max-results');
    const parsed = settings.get_boolean('enable-prefix-modes')
        ? parseQuery(text)
        : {mode: 'all', query: text.trim()};

    if (parsed.mode !== 'all')
        return _runMode(parsed.mode, parsed.query, settings, maxResults);

    return _runAll(parsed.query, settings, maxResults);
}

export function runEmptySuggestions(settings) {
    if (!settings.get_boolean('show-empty-suggestions'))
        return [];

    const maxResults = settings.get_int('max-results');
    const results = [];

    if (settings.get_boolean('enable-window-search'))
        results.push(...searchWindows('', maxResults));

    if (settings.get_boolean('enable-app-search'))
        results.push(...searchFrequentApps(maxResults));

    return results;
}
