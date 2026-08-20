// gosh is launcher - open a typed filesystem path
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {isPathQuery, expandHomePath, fileUriFromAbsolute} from './homePath.js';
import {basenameFromUri, iconForBasename} from './recentXbel.js';
import {openUri} from './gioLaunch.js';

export function searchPath(query) {
    const trimmed = query.trim();
    if (!isPathQuery(trimmed))
        return [];

    const home = GLib.get_home_dir() || '';
    const resolved = expandHomePath(trimmed, home);
    if (!resolved)
        return [];

    const file = Gio.File.new_for_path(resolved);
    if (!file.query_exists(null)) {
        return [{
            type: 'path',
            title: trimmed,
            description: 'Path not found',
            icon: 'dialog-warning-symbolic',
            activate: () => {},
        }];
    }

    const kind = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null);
    const icon = kind === Gio.FileType.DIRECTORY
        ? 'folder-symbolic'
        : iconForBasename(basenameFromUri(resolved));

    return [{
        type: 'path',
        title: resolved,
        description: 'Open path',
        icon,
        activate: () => {
            openUri(fileUriFromAbsolute(resolved));
        },
    }];
}
