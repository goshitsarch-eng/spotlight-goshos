// gosh is launcher - web search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import {getEngine} from './webEngines.js';
import {openUri} from './gioLaunch.js';

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
        id: `web:${engine.id}`,
        activate: () => {
            openUri(engine.url + encodeURIComponent(query));
        },
    }];
}
