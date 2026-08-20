// gosh is launcher - decides which providers a query should run
// SPDX-License-Identifier: GPL-3.0-or-later

import {parseQuery} from './prefixParser.js';

const PREFIX_TO_FLAG = {
    calculator: 'calculator',
    web: 'web',
    settings: 'settings',
    windows: 'windows',
    files: 'files',
    command: 'command',
};

const DEFAULT_ORDER = ['url', 'apps', 'calculator', 'windows', 'system', 'settings', 'files'];
const WINDOWS_FIRST_ORDER = ['url', 'windows', 'apps', 'calculator', 'system', 'settings', 'files'];

export function flagsFromSettings(settings) {
    return {
        prefixModes: settings.get_boolean('enable-prefix-modes'),
        url: settings.get_boolean('enable-url-open'),
        apps: settings.get_boolean('enable-app-search'),
        calculator: settings.get_boolean('enable-calculator'),
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

export function planSearch(text, flags) {
    const parsed = flags.prefixModes
        ? parseQuery(text)
        : {mode: 'all', query: text.trim()};

    if (parsed.mode === 'all' && !isActiveSearchQuery(parsed.query)) {
        return {
            mode: 'all',
            query: '',
            providers: [],
            webFallback: false,
        };
    }

    if (parsed.mode !== 'all') {
        const flag = PREFIX_TO_FLAG[parsed.mode];
        return {
            mode: parsed.mode,
            query: parsed.query,
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
        query: parsed.query,
        providers,
        webFallback: flags.web,
    };
}
