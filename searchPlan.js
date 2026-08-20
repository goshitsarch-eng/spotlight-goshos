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

const POLITE_PREFIX = /^(please|can\s+you|could\s+you|would\s+you|will\s+you|tell\s+me|help\s+me|just|i\s+want\s+to)\s+/i;
const LAUNCH_VERB = /^(open|launch|run|start|show|find|search(?:\s+for)?|look(?:\s+up|\s+for|up)|switch\s+to|go\s+to|navigate\s+to|focus|convert|calculate|compute|what(?:['’]s|s|\s+is)|how\s+much\s+is)\s+(.+)$/i;
// open source and open office are names not a verb plus a target
const KEEP_OPEN_NAME = /^(source|office|vpn|jdk)\b/i;
const LEADING_ARTICLE = /^(?:my|the|an?|me)\s+(.+)$/i;
const CATEGORY_PREFIX = /^(windows?|settings?|files?|recent(?:\s+files?)?|apps?|applications?)\s+(.+)$/i;
const TRAILING_NOUN = /^(.+)\s+(folders?|directories|directory|dirs?|settings?|preferences|prefs)$/i;

function stripPolitePrefixes(query) {
    let text = query;
    let next = text.replace(POLITE_PREFIX, '');
    while (next !== text) {
        text = next.trim();
        next = text.replace(POLITE_PREFIX, '');
    }
    return text;
}

function stripOneArticle(query) {
    const match = LEADING_ARTICLE.exec(query);
    if (!match)
        return query;

    const rest = match[1].trim();
    return rest.length > 0 ? rest : query;
}

function stripLeadingArticles(query) {
    let text = query;
    let next = stripOneArticle(text);
    while (next !== text) {
        text = next;
        next = stripOneArticle(text);
    }
    return text;
}

function stripOnePrefix(query, pattern) {
    const match = pattern.exec(query);
    if (!match)
        return query;

    const rest = match[2].trim();
    return rest.length > 0 ? rest : query;
}

function stripTrailingNoun(query) {
    const match = TRAILING_NOUN.exec(query);
    if (!match)
        return query;

    const rest = match[1].trim();
    return rest.length > 0 ? rest : query;
}

// open firefox and can you open firefox are how people talk to a launcher
export function stripLeadingVerb(query) {
    let text = stripPolitePrefixes(query.trim());
    const match = LAUNCH_VERB.exec(text);
    if (match) {
        const rest = match[2].trim();
        if (rest.length > 0 && !(match[1].toLowerCase() === 'open' && KEEP_OPEN_NAME.test(rest)))
            text = rest;
    }

    text = stripLeadingArticles(text);
    text = stripAnswerTo(text);
    // find windows firefox and open wifi settings keep the noun
    text = stripOnePrefix(text, CATEGORY_PREFIX);
    return stripTrailingNoun(text);
}

function stripAnswerTo(query) {
    const match = /^(?:the\s+)?answer\s+to\s+(.+)$/i.exec(query);
    if (!match)
        return query;
    const rest = match[1].trim();
    return rest.length > 0 ? rest : query;
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
