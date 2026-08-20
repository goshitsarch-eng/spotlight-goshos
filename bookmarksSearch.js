// gosh is launcher - gtk bookmark provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {mergeBookmarkFiles, matchBookmarks, bookmarkDescription, bookmarkIcon} from './bookmarkParse.js';
import {openUri} from './gioLaunch.js';

let _rows = null;
let _loading = false;
let _onReady = null;
let _loadId = 0;

export function invalidateBookmarks() {
    _rows = null;
    _loading = false;
    _onReady = null;
    _loadId += 1;
}

export function ensureBookmarks(onReady) {
    if (_rows !== null)
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

function _existsFinished(src, res) {
    try {
        return src.query_exists_finish(res);
    } catch (e) {
        return false;
    }
}

function _contentsFinished(src, res) {
    try {
        const [, contents] = src.load_contents_finish(res);
        return new TextDecoder().decode(contents);
    } catch (e) {
        return '';
    }
}

function _bookmarkPaths() {
    const config = GLib.get_user_config_dir();
    return [
        GLib.build_filenamev([config, 'gtk-3.0', 'bookmarks']),
        GLib.build_filenamev([config, 'gtk-4.0', 'bookmarks']),
    ];
}

function _startLoad() {
    const loadId = _loadId;
    _loading = true;
    const paths = _bookmarkPaths();
    const texts = new Array(paths.length);
    let pending = paths.length;
    const finishOne = () => {
        pending--;
        if (pending > 0)
            return;
        if (loadId !== _loadId)
            return;
        _rows = mergeBookmarkFiles(texts.map(text => text || ''), GLib.get_home_dir() || '');
        _loading = false;
        _flush();
    };

    for (let i = 0; i < paths.length; i++) {
        const index = i;
        const file = Gio.File.new_for_path(paths[i]);
        file.query_exists_async(GLib.PRIORITY_DEFAULT, null, (src, existsRes) => {
            const exists = _existsFinished(src, existsRes);
            if (loadId !== _loadId)
                return;
            if (!exists) {
                texts[index] = '';
                finishOne();
                return;
            }
            src.load_contents_async(null, (loaded, loadRes) => {
                texts[index] = _contentsFinished(loaded, loadRes);
                if (loadId !== _loadId)
                    return;
                finishOne();
            });
        });
    }
}

export function searchBookmarks(query, maxResults) {
    if (_rows === null)
        return [];

    const home = GLib.get_home_dir() || '';
    const described = _rows.map(row => ({
        uri: row.uri,
        title: row.title,
        description: bookmarkDescription(row.uri, home),
    }));
    return matchBookmarks(described, query, maxResults).map(row => ({
        type: 'bookmark',
        title: row.title,
        description: row.description,
        icon: bookmarkIcon(row.uri),
        activate: () => {
            openUri(row.uri);
        },
    }));
}
