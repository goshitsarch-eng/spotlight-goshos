// gosh is launcher - url open provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import {isUrlQuery, normalizeUrl} from './urlMatch.js';

export function searchUrl(query) {
    if (!isUrlQuery(query))
        return [];

    const url = normalizeUrl(query);
    return [{
        type: 'url',
        title: url,
        description: 'Open in browser',
        icon: 'web-browser-symbolic',
        activate: () => {
            Gio.app_info_launch_default_for_uri(url, null);
        },
    }];
}
