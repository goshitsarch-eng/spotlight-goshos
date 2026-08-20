// gosh is launcher - search controller
// SPDX-License-Identifier: GPL-3.0-or-later

import {searchApps, searchFrequentApps} from './appSearch.js';
import {searchCalculator} from './calculatorSearch.js';
import {searchUnits} from './unitSearch.js';
import {searchSystemActions} from './systemActionsSearch.js';
import {searchSettings} from './settingsSearch.js';
import {searchWeb} from './webSearch.js';
import {searchWindows} from './windowSearch.js';
import {searchUrl} from './urlSearch.js';
import {searchPath} from './pathSearch.js';
import {searchCommand} from './commandSearch.js';
import {searchRecentFiles} from './recentFilesSearch.js';
import {flagsFromSettings, planSearch, mergeEmptySuggestions} from './searchPlan.js';
import {collectSearchResults} from './searchRun.js';

const PROVIDERS = {
    url: (query, _max, _settings) => searchUrl(query),
    path: (query, _max, _settings) => searchPath(query),
    apps: (query, max, settings) => searchApps(
        query, max, settings && settings.get_boolean('enable-app-actions')),
    calculator: (query, _max, _settings, mode) => searchCalculator(query, mode === 'calculator'),
    units: query => searchUnits(query),
    windows: (query, max) => searchWindows(query, max),
    system: (query, max) => searchSystemActions(query, max),
    settings: (query, max) => searchSettings(query, max),
    files: (query, max) => searchRecentFiles(query, max),
    command: query => searchCommand(query),
    web: (query, _max, settings) => searchWeb(query, settings.get_string('web-search-engine')),
};

// orchestrates all search providers and combines results in priority order
// priority: urls paths apps calculator units windows system settings files then web last
export function runSearch(text, settings) {
    const maxResults = settings.get_int('max-results');
    const plan = planSearch(text, flagsFromSettings(settings));
    return collectSearchResults(plan, maxResults, PROVIDERS, settings);
}

export function runEmptySuggestions(settings) {
    if (!settings.get_boolean('show-empty-suggestions'))
        return [];

    const maxResults = settings.get_int('max-results');
    const windows = settings.get_boolean('enable-window-search')
        ? searchWindows('', maxResults)
        : [];
    const apps = settings.get_boolean('enable-app-search')
        ? searchFrequentApps(maxResults)
        : [];
    return mergeEmptySuggestions(settings.get_string('result-order'), windows, apps);
}
