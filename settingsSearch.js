// gosh is launcher - settings search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import {matchSettingsPanels, settingsArgv, settingsPanelAvailable, settingsResultMeta} from './settingsPanels.js';
import {spawnArgv, findInUserPath} from './gioLaunch.js';

function _hasDesktop(desktopId) {
    if (!Gio.DesktopAppInfo || typeof Gio.DesktopAppInfo.new !== 'function')
        return true;
    return Boolean(Gio.DesktopAppInfo.new(desktopId));
}

// searches gnome settings panels by title
// normalizes by removing hyphens and underscores so wifi matches wi-fi
export function searchSettings(query, maxResults) {
    return matchSettingsPanels(
        query,
        maxResults,
        id => settingsPanelAvailable(id, _hasDesktop),
    ).map(panel => {
        const argv = settingsArgv(panel.id, name => findInUserPath(name));
        const row = settingsResultMeta(panel, argv);
        row.activate = () => {
            if (argv)
                spawnArgv(argv);
        };
        return row;
    });
}
