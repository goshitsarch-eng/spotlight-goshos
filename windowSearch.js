// gosh is launcher - open window provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

function _windowMatches(win, query) {
    if (query.length === 0)
        return true;
    const title = (win.get_title() || '').toLowerCase();
    const wmClass = (win.get_wm_class() || '').toLowerCase();
    return title.includes(query) || wmClass.includes(query);
}

function _windowIcon(win) {
    const tracker = Shell.WindowTracker.get_default();
    const app = tracker.get_window_app(win);
    if (app)
        return app.get_icon();
    return 'focus-windows-symbolic';
}

export function searchWindows(query, maxResults) {
    const q = query.toLowerCase();
    const results = [];
    const actors = global.get_window_actors();

    for (const actor of actors) {
        const win = actor.meta_window;
        if (!win || win.is_skip_taskbar())
            continue;

        const type = win.get_window_type();
        if (type !== Meta.WindowType.NORMAL && type !== Meta.WindowType.DIALOG)
            continue;

        if (!_windowMatches(win, q))
            continue;

        const title = win.get_title() || 'Untitled';
        const icon = _windowIcon(win);
        results.push({
            type: 'window',
            title,
            description: 'Switch to window',
            icon,
            activate: () => Main.activateWindow(win),
        });

        if (results.length >= maxResults)
            break;
    }

    return results;
}
