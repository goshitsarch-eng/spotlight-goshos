// gosh is launcher - settings search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import {matchSettingsPanels} from './settingsPanels.js';
import {spawnArgv} from './gioLaunch.js';

// searches gnome settings panels by title
// normalizes by removing hyphens and underscores so wifi matches wi-fi
export function searchSettings(query, maxResults) {
    return matchSettingsPanels(query, maxResults).map(panel => ({
        type: 'settings',
        title: panel.title,
        description: 'GNOME Settings',
        icon: 'preferences-system-symbolic',
        activate: () => {
            spawnArgv(['gnome-control-center', panel.id]);
        },
    }));
}
