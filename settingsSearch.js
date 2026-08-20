// gosh is launcher - settings search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import {matchSettingsPanels, settingsArgv} from './settingsPanels.js';
import {spawnArgv} from './gioLaunch.js';

// searches gnome settings panels by title
// normalizes by removing hyphens and underscores so wifi matches wi-fi
export function searchSettings(query, maxResults) {
    return matchSettingsPanels(query, maxResults).map(panel => ({
        type: 'settings',
        title: panel.title,
        description: 'GNOME Settings',
        icon: panel.icon || 'preferences-system-symbolic',
        activate: () => {
            const argv = settingsArgv(panel.id, name => GLib.find_program_in_path(name));
            if (argv)
                spawnArgv(argv);
        },
    }));
}
