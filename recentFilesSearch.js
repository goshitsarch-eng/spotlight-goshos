// gosh is launcher - recent files provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const HREF_RE = /href="(file:[^"]+)"/g;

function _readRecentXbel() {
    const path = GLib.build_filenamev([GLib.get_user_data_dir(), 'recently-used.xbel']);
    const file = Gio.File.new_for_path(path);
    if (!file.query_exists(null))
        return '';

    const [, contents] = file.load_contents(null);
    return new TextDecoder().decode(contents);
}

function _basename(uri) {
    const decoded = GLib.uri_unescape_string(uri, null) || uri;
    const parts = decoded.split('/');
    return parts[parts.length - 1] || decoded;
}

export function searchRecentFiles(query, maxResults) {
    const q = query.toLowerCase();
    const text = _readRecentXbel();
    if (text.length === 0)
        return [];

    const results = [];
    const seen = new Set();
    HREF_RE.lastIndex = 0;
    let match = HREF_RE.exec(text);
    while (match !== null && results.length < maxResults) {
        const uri = match[1];
        match = HREF_RE.exec(text);
        if (seen.has(uri))
            continue;

        const name = _basename(uri);
        if (q.length > 0 && !name.toLowerCase().includes(q))
            continue;
        if (!Gio.File.new_for_uri(uri).query_exists(null))
            continue;

        seen.add(uri);
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
