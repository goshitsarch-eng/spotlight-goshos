// gosh is launcher - open window provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {windowMatches, windowClassText, shouldListWindow, sortWindowsMostRecent, windowWorkspaceLabel} from './windowMatch.js';

function _metaWindows() {
    // list_all_windows is the display list actors can lag behind closed windows
    if (typeof global.display.list_all_windows === 'function')
        return global.display.list_all_windows();
    const windows = [];
    for (const actor of global.get_window_actors()) {
        if (actor.meta_window)
            windows.push(actor.meta_window);
    }
    return windows;
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
    const windows = sortWindowsMostRecent(_metaWindows(), win => win.get_user_time());

    for (const win of windows) {
        if (!win)
            continue;

        const type = win.get_window_type();
        // skip closed actors that linger in get_window_actors
        if (!shouldListWindow(
            win.get_workspace(),
            win.is_skip_taskbar(),
            type,
            [Meta.WindowType.NORMAL, Meta.WindowType.DIALOG, Meta.WindowType.MODAL_DIALOG],
        ))
            continue;

        const sandboxed = typeof win.get_sandboxed_app_id === 'function'
            ? win.get_sandboxed_app_id()
            : '';
        const wmClass = windowClassText(
            win.get_wm_class(),
            win.get_wm_class_instance(),
            sandboxed,
        );
        if (!windowMatches(win.get_title() || '', wmClass, q))
            continue;

        const title = win.get_title() || 'Untitled';
        const icon = _windowIcon(win);
        const workspace = win.get_workspace();
        results.push({
            type: 'window',
            title,
            description: windowWorkspaceLabel(
                workspace ? workspace.index() : -1,
                win.is_on_all_workspaces(),
            ),
            icon,
            activate: () => {
                if (!win.get_workspace())
                    return;
                Main.activateWindow(win);
            },
        });

        if (results.length >= maxResults)
            break;
    }

    return results;
}
