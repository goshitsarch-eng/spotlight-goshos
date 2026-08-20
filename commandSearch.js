// gosh is launcher - run command provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {firstCommandArg, commandIsReady, commandUsesPathLookup, commandRowMeta} from './commandReady.js';
import {expandHomeArgv} from './homePath.js';
import {spawnArgv} from './gioLaunch.js';

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

function _rowFor(query, resolved, ready) {
    const row = commandRowMeta(query, ready);
    row.activate = ready
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
    return expandHomeArgv(argv, GLib.get_home_dir() || '');
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
            name => GLib.find_program_in_path(name),
            () => false,
        );
        return [_rowFor(query, resolved, ready)];
    }

    if (_query === query && _resolved && _row)
        return [_row];

    return [_rowFor(query, resolved, true)];
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
        'standard::type',
        Gio.FileQueryInfoFlags.NONE,
        GLib.PRIORITY_DEFAULT,
        null,
        (src, res) => {
            let ready = false;
            try {
                src.query_info_finish(res);
                ready = true;
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
