// gosh is launcher - recent files provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {parseRecentXbel, basenameFromUri} from './recentXbel.js';

// cache is filled on an async read so search never calls load_contents
// on the compositor thread https://gjs.guide/extensions/review-guidelines/review-guidelines.html
let _uris = null;
let _loading = false;
let _onReady = null;
let _loadId = 0;

export function invalidateRecentFiles() {
    _uris = null;
    _loading = false;
    _onReady = null;
    _loadId += 1;
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

function _startLoad() {
    const loadId = _loadId;
    _loading = true;
    const path = GLib.build_filenamev([GLib.get_user_data_dir(), 'recently-used.xbel']);
    const file = Gio.File.new_for_path(path);
    file.query_exists_async(GLib.PRIORITY_DEFAULT, null, (src, existsRes) => {
        const exists = src.query_exists_finish(existsRes);
        if (loadId !== _loadId)
            return;
        if (!exists) {
            _uris = [];
            _loading = false;
            _flush();
            return;
        }
        src.load_contents_async(null, (loaded, loadRes) => {
            const [, contents] = loaded.load_contents_finish(loadRes);
            if (loadId !== _loadId)
                return;
            const text = new TextDecoder().decode(contents);
            _keepExisting(loadId, parseRecentXbel(text));
        });
    });
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
    for (let i = 0; i < uris.length; i++) {
        const file = Gio.File.new_for_uri(uris[i]);
        const index = i;
        file.query_exists_async(GLib.PRIORITY_DEFAULT, null, (src, res) => {
            const exists = src.query_exists_finish(res);
            if (loadId !== _loadId)
                return;
            if (exists)
                kept[index] = uris[index];
            pending--;
            if (pending === 0) {
                _uris = kept.filter(uri => uri);
                _loading = false;
                _flush();
            }
        });
    }
}

export function searchRecentFiles(query, maxResults) {
    if (_uris === null)
        return [];

    const q = query.toLowerCase();
    const results = [];
    for (const uri of _uris) {
        if (results.length >= maxResults)
            break;
        const name = basenameFromUri(uri);
        if (q.length > 0 && !name.toLowerCase().includes(q))
            continue;
        results.push({
            type: 'file',
            title: name,
            description: 'Recent file',
            icon: 'document-open-recent-symbolic',
            activate: () => {
                Gio.app_info_launch_default_for_uri(uri, null);
            },
        });
    }
    return results;
}
