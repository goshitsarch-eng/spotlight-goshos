// gosh is launcher - run command provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {firstCommandArg, commandIsReady, commandFileIsReady, commandUsesPathLookup, commandRowMeta} from './commandReady.js';
import {resolveCommandArgv} from './homePath.js';
import {spawnArgv, findInUserPath} from './gioLaunch.js';

let _query = '';
let _row = null;
let _resolved = false;
let _onReady = null;
let _loadId = 0;

export function invalidateCommandLookup() {
    _query = '';
    _row = null;
    _resolved = false;
    _onReady = null;
    _loadId += 1;
}

function _rowFor(query, resolved, ready, checking = false) {
    const row = commandRowMeta(query, ready, checking);
    row.activate = ready && !checking
        ? () => spawnArgv(resolved)
        : () => {};
    return row;
}

function _parseResolved(query) {
    if (query.length === 0)
        return null;
    const [ok, argv] = GLib.shell_parse_argv(query);
    if (!ok || argv.length === 0)
        return null;
    return resolveCommandArgv(argv, GLib.get_home_dir() || '');
}

// only offered when the user used the ! prefix so ordinary searches
// never spawn a process
export function searchCommand(query) {
    const resolved = _parseResolved(query);
    if (!resolved)
        return [];

    const exe = firstCommandArg(resolved);
    if (commandUsesPathLookup(exe)) {
        const ready = commandIsReady(
            exe,
            name => findInUserPath(name),
            () => false,
        );
        return [_rowFor(query, resolved, ready)];
    }

    if (_query === query && _resolved && _row)
        return [_row];

    return [_rowFor(query, resolved, false, true)];
}

export function ensureCommand(query, onReady) {
    const resolved = _parseResolved(query);
    if (!resolved)
        return;
    if (commandUsesPathLookup(firstCommandArg(resolved)))
        return;
    if (_query === query && _resolved)
        return;
    _onReady = onReady;
    if (_query === query && !_resolved)
        return;
    _start(query, resolved);
}

function _start(query, resolved) {
    _loadId += 1;
    const loadId = _loadId;
    _query = query;
    _resolved = false;
    const exe = firstCommandArg(resolved);
    const file = Gio.File.new_for_path(exe);
    file.query_info_async(
        'standard::type,access::can-execute',
        Gio.FileQueryInfoFlags.NONE,
        GLib.PRIORITY_DEFAULT,
        null,
        (src, res) => {
            let ready = false;
            try {
                const info = src.query_info_finish(res);
                ready = commandFileIsReady(
                    info.get_file_type() === Gio.FileType.DIRECTORY,
                    info.get_attribute_boolean('access::can-execute'),
                );
            } catch (e) {
                ready = false;
            }
            if (loadId !== _loadId)
                return;
            _row = _rowFor(query, resolved, ready);
            _resolved = true;
            const cb = _onReady;
            _onReady = null;
            if (cb)
                cb();
        }
    );
}
