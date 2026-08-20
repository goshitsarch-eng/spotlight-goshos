// gosh is launcher - url open provider
// SPDX-License-Identifier: GPL-3.0-or-later

import {isUrlQuery, normalizeUrl, urlRowDescription, urlRowIcon} from './urlMatch.js';
import {openUri} from './gioLaunch.js';

export function searchUrl(query) {
    if (!isUrlQuery(query))
        return [];

    const url = normalizeUrl(query);
    return [{
        type: 'url',
        title: url,
        description: urlRowDescription(url),
        icon: urlRowIcon(url),
        activate: () => {
            openUri(url);
        },
    }];
}
