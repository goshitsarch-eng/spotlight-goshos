// gosh is launcher - settings search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import {matchSettingsPanels, settingsArgv, settingsPanelAvailable, settingsResultMeta, firstDesktopAppInfoCtor, settingsDesktopExists} from './settingsPanels.js';
import {spawnArgv, findInUserPath} from './gioLaunch.js';

function _gioUnixDesktopAppInfo() {
    try {
        const GioUnix = imports.gi.GioUnix;
        return GioUnix ? GioUnix.DesktopAppInfo : null;
    } catch (e) {
        // gio unix typelib is not on every 45 host
        return null;
    }
}

function _desktopCtor() {
    const unix = _gioUnixDesktopAppInfo();
    if (unix && typeof unix.new === 'function')
        return firstDesktopAppInfoCtor([unix]);
    return firstDesktopAppInfoCtor([Gio.DesktopAppInfo]);
}

function _hasDesktop(desktopId) {
    return settingsDesktopExists(desktopId, _desktopCtor());
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
