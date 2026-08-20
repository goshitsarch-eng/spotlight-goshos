// gosh is launcher - decides which providers a query should run
// SPDX-License-Identifier: GPL-3.0-or-later

import {parseQuery} from './prefixParser.js';
import {isPathQuery} from './homePath.js';

const PREFIX_TO_FLAG = {
    calculator: 'calculator',
    web: 'web',
    settings: 'settings',
    windows: 'windows',
    files: 'files',
    command: 'command',
};

const DEFAULT_ORDER = ['url', 'path', 'places', 'bookmarks', 'apps', 'calculator', 'units', 'color', 'time', 'windows', 'system', 'settings', 'files'];
const WINDOWS_FIRST_ORDER = ['url', 'path', 'places', 'bookmarks', 'windows', 'apps', 'calculator', 'units', 'color', 'time', 'system', 'settings', 'files'];
const STRIP_VERB_MODES = {
    all: true,
    windows: true,
    settings: true,
    files: true,
};

// open firefox and switch to term are how people talk to a launcher
export function stripLeadingVerb(query) {
    const text = query.trim();
    const match = /^(open|launch|run|start|show|find|search(?:\s+for)?|look\s+(?:up|for)|switch\s+to|go\s+to|focus)\s+(.+)$/i.exec(text);
    if (!match)
        return text;
    const rest = match[2].trim();
    return rest.length > 0 ? rest : text;
}

export function flagsFromSettings(settings) {
    return {
        prefixModes: settings.get_boolean('enable-prefix-modes'),
        url: settings.get_boolean('enable-url-open'),
        path: settings.get_boolean('enable-path-open'),
        places: settings.get_boolean('enable-places'),
        bookmarks: settings.get_boolean('enable-bookmarks'),
        apps: settings.get_boolean('enable-app-search'),
        calculator: settings.get_boolean('enable-calculator'),
        units: settings.get_boolean('enable-unit-convert'),
        color: settings.get_boolean('enable-color-hex'),
        time: settings.get_boolean('enable-time-date'),
        windows: settings.get_boolean('enable-window-search'),
        system: settings.get_boolean('enable-system-actions'),
        settings: settings.get_boolean('enable-settings-search'),
        files: settings.get_boolean('enable-recent-files'),
        command: settings.get_boolean('enable-command-run'),
        web: settings.get_boolean('show-web-search'),
        resultOrder: settings.get_string('result-order'),
    };
}

// empty all-mode must not run providers
// window and settings matchers treat "" as a hit so a stale paint
// after the user clears the entry would dump every window and panel
export function isActiveSearchQuery(query) {
    return query.trim().length > 0;
}

// skip xbel io when files cannot appear in this plan
export function shouldRefreshRecentFiles(enableRecent, plan) {
    if (!enableRecent)
        return false;
    if (plan.mode === 'files')
        return true;
    return plan.mode === 'all' && plan.providers.includes('files');
}

export function shouldRefreshPath(enablePath, plan) {
    if (!enablePath)
        return false;
    return plan.providers.includes('path') && isPathQuery(plan.query);
}

export function shouldRefreshCommand(enableCommand, plan) {
    if (!enableCommand)
        return false;
    return plan.mode === 'command' && plan.providers.includes('command');
}

export function shouldRefreshBookmarks(enableBookmarks, plan) {
    if (!enableBookmarks)
        return false;
    return plan.mode === 'all' && plan.providers.includes('bookmarks');
}

export function mergeEmptySuggestions(resultOrder, windows, apps) {
    if (resultOrder === 'windows-first')
        return windows.concat(apps);
    return apps.concat(windows);
}

export function planSearch(text, flags) {
    const parsed = flags.prefixModes
        ? parseQuery(text)
        : {mode: 'all', query: text.trim()};
    const query = STRIP_VERB_MODES[parsed.mode]
        ? stripLeadingVerb(parsed.query)
        : parsed.query;

    if (parsed.mode === 'all' && !isActiveSearchQuery(query)) {
        return {
            mode: 'all',
            query: '',
            providers: [],
            webFallback: false,
        };
    }

    if (parsed.mode !== 'all') {
        // @ is an explicit search turning off fallback must not kill it
        if (parsed.mode === 'web') {
            return {
                mode: 'web',
                query,
                providers: ['web'],
                webFallback: false,
            };
        }
        const flag = PREFIX_TO_FLAG[parsed.mode];
        return {
            mode: parsed.mode,
            query,
            providers: flags[flag] ? [parsed.mode] : [],
            webFallback: false,
        };
    }

    const order = flags.resultOrder === 'windows-first'
        ? WINDOWS_FIRST_ORDER
        : DEFAULT_ORDER;
    const providers = order.filter(name => flags[name]);
    return {
        mode: 'all',
        query,
        providers,
        webFallback: flags.web,
    };
}
