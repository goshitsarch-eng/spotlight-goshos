// gosh is launcher - recent files provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {
    parseRecentXbel, basenameFromUri, iconForBasename, parentPathFromFileUri,
    recentFileMatches, RECENT_EXISTS_BUDGET_MS, recentExistsShouldSettle,
} from './recentXbel.js';
import {collapseHomePath} from './homePath.js';
import {openUri} from './gioLaunch.js';

// cache is filled on an async read so search never calls load_contents
// on the compositor thread https://gjs.guide/extensions/review-guidelines/review-guidelines.html
let _uris = null;
let _loading = false;
let _onReady = null;
let _loadId = 0;
let _timeoutId = 0;

function _clearTimeout() {
    if (_timeoutId) {
        GLib.source_remove(_timeoutId);
        _timeoutId = 0;
    }
}

export function invalidateRecentFiles() {
    _uris = null;
    _loading = false;
    _onReady = null;
    _loadId += 1;
    _clearTimeout();
}

export function ensureRecentFiles(onReady) {
    if (_uris !== null)
        return;
    _onReady = onReady;
    if (!_loading)
        _startLoad();
}

function _flush() {
    const cb = _onReady;
    _onReady = null;
    if (cb)
        cb();
}

// gio finish raises gerror when the file cannot be queried
function _existsFinished(src, res) {
    try {
        return src.query_exists_finish(res);
    } catch (e) {
        return false;
    }
}

function _startLoad() {
    const loadId = _loadId;
    _loading = true;
    const path = GLib.build_filenamev([GLib.get_user_data_dir(), 'recently-used.xbel']);
    const file = Gio.File.new_for_path(path);
    file.query_exists_async(GLib.PRIORITY_DEFAULT, null, (src, existsRes) => {
        const exists = _existsFinished(src, existsRes);
        if (loadId !== _loadId)
            return;
        if (!exists) {
            _uris = [];
            _loading = false;
            _flush();
            return;
        }
        src.load_contents_async(null, (loaded, loadRes) => {
            let contents;
            // finish must run even when the read fails or _loading sticks
            try {
                [, contents] = loaded.load_contents_finish(loadRes);
            } catch (e) {
                if (loadId !== _loadId)
                    return;
                _uris = [];
                _loading = false;
                _flush();
                return;
            }
            if (loadId !== _loadId)
                return;
            const text = new TextDecoder().decode(contents);
            _keepExisting(loadId, parseRecentXbel(text));
        });
    });
}

function _settleKept(loadId, kept) {
    if (loadId !== _loadId)
        return;
    _clearTimeout();
    _uris = kept.filter(uri => uri);
    _loading = false;
    _flush();
}

function _keepExisting(loadId, uris) {
    if (uris.length === 0) {
        _uris = [];
        _loading = false;
        _flush();
        return;
    }

    const kept = new Array(uris.length);
    let pending = uris.length;
    let settled = false;
    const started = GLib.get_monotonic_time();
    const settle = () => {
        if (settled)
            return;
        settled = true;
        _settleKept(loadId, kept);
    };

    _timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, RECENT_EXISTS_BUDGET_MS, () => {
        _timeoutId = 0;
        settle();
        return GLib.SOURCE_REMOVE;
    });

    for (let i = 0; i < uris.length; i++) {
        const file = Gio.File.new_for_uri(uris[i]);
        const index = i;
        file.query_exists_async(GLib.PRIORITY_DEFAULT, null, (src, res) => {
            const exists = _existsFinished(src, res);
            if (loadId !== _loadId)
                return;
            if (exists)
                kept[index] = uris[index];
            pending--;
            const elapsedMs = (GLib.get_monotonic_time() - started) / 1000;
            if (recentExistsShouldSettle(pending, elapsedMs, RECENT_EXISTS_BUDGET_MS))
                settle();
        });
    }
}

export function searchRecentFiles(query, maxResults) {
    if (_uris === null)
        return [];

    const q = query.toLowerCase();
    const home = GLib.get_home_dir() || '';
    const results = [];
    for (const uri of _uris) {
        if (results.length >= maxResults)
            break;
        const name = basenameFromUri(uri);
        const parent = parentPathFromFileUri(uri);
        const folder = parent ? collapseHomePath(parent, home) : 'Recent file';
        if (!recentFileMatches(name, folder, q))
            continue;
        results.push({
            type: 'file',
            title: name,
            description: folder,
            icon: iconForBasename(name),
            activate: () => {
                openUri(uri);
            },
        });
    }
    return results;
}
