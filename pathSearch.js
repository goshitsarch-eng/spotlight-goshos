// gosh is launcher - open a typed filesystem path
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {isPathQuery, expandHomePath, fileUriFromAbsolute} from './homePath.js';
import {pathRowMeta} from './pathMatch.js';
import {openUri} from './gioLaunch.js';

let _query = '';
let _row = null;
let _resolved = false;
let _onReady = null;
let _loadId = 0;

export function invalidatePathLookup() {
    _query = '';
    _row = null;
    _resolved = false;
    _onReady = null;
    _loadId += 1;
}

export function pathRow(trimmed, resolved, kind) {
    const row = pathRowMeta(trimmed, resolved, kind);
    row.activate = kind === 'missing'
        ? () => {}
        : () => {
            openUri(fileUriFromAbsolute(resolved));
        };
    return row;
}

export function searchPath(query) {
    const trimmed = query.trim();
    if (!isPathQuery(trimmed))
        return [];

    const home = GLib.get_home_dir() || '';
    const resolved = expandHomePath(trimmed, home);
    if (!resolved)
        return [];

    if (_query === trimmed && _resolved && _row)
        return [_row];

    return [pathRow(trimmed, resolved, 'file')];
}

export function ensurePath(query, onReady) {
    const trimmed = query.trim();
    if (!isPathQuery(trimmed))
        return;
    if (_query === trimmed && _resolved)
        return;
    _onReady = onReady;
    if (_query === trimmed && !_resolved)
        return;
    _start(trimmed);
}

function _kindFromFileType(fileType) {
    if (fileType === Gio.FileType.DIRECTORY)
        return 'directory';
    return 'file';
}

function _start(trimmed) {
    _loadId += 1;
    const loadId = _loadId;
    _query = trimmed;
    _resolved = false;
    const home = GLib.get_home_dir() || '';
    const resolved = expandHomePath(trimmed, home);
    const file = Gio.File.new_for_path(resolved);
    file.query_info_async(
        'standard::type',
        Gio.FileQueryInfoFlags.NONE,
        GLib.PRIORITY_DEFAULT,
        null,
        (src, res) => {
            let kind = 'missing';
            try {
                kind = _kindFromFileType(src.query_info_finish(res).get_file_type());
            } catch (e) {
                kind = 'missing';
            }
            if (loadId !== _loadId)
                return;
            _row = pathRow(trimmed, resolved, kind);
            _resolved = true;
            const cb = _onReady;
            _onReady = null;
            if (cb)
                cb();
        }
    );
}
