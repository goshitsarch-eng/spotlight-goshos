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

const ALL_ORDER = ['url', 'apps', 'calculator', 'windows', 'system', 'settings', 'files'];

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
    };
}

export function planSearch(text, flags) {
    const parsed = flags.prefixModes
        ? parseQuery(text)
        : {mode: 'all', query: text.trim()};

    if (parsed.mode !== 'all') {
        const flag = PREFIX_TO_FLAG[parsed.mode];
        return {
            mode: parsed.mode,
            query: parsed.query,
            providers: flags[flag] ? [parsed.mode] : [],
            webFallback: false,
        };
    }

    const providers = ALL_ORDER.filter(name => flags[name]);
    return {
        mode: 'all',
        query: parsed.query,
        providers,
        webFallback: flags.web,
    };
}
