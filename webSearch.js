// gosh is launcher - web search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import {getEngine} from './webEngines.js';

// returns a web search result for the given query
export function searchWeb(query, engineName) {
    if (query.length === 0)
        return [];

    const engine = getEngine(engineName);
    return [{
        type: 'web',
        title: `Search ${engine.label} for "${query}"`,
        description: `Open ${engine.label} in your browser`,
        icon: 'web-browser-symbolic',
        activate: () => {
            Gio.app_info_launch_default_for_uri(
                engine.url + encodeURIComponent(query), null);
        },
    }];
}
