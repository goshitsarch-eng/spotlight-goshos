// gosh is launcher - open window provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {parseWindowCloseQuery, windowCloseTitle, shouldForceQuitWindow} from './windowClose.js';
import {parseWorkspaceSwitchQuery, workspaceSwitchTitle, workspaceIndexInRange} from './workspaceQuery.js';
import {windowMatches, windowClassText, shouldListWindow, sortWindowsMostRecent, windowWorkspaceLabel, windowRecencyValue} from './windowMatch.js';

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

function _tabRanks() {
    const ranks = new Map();
    if (typeof global.display.get_tab_list !== 'function' || !Meta.TabList)
        return ranks;
    const list = global.display.get_tab_list(Meta.TabList.NORMAL, null);
    if (!list)
        return ranks;
    for (let i = 0; i < list.length; i++)
        ranks.set(list[i], windowRecencyValue(i, list.length, 0));
    return ranks;
}

function _windowIcon(win) {
    const tracker = Shell.WindowTracker.get_default();
    const app = tracker.get_window_app(win);
    if (app)
        return app.get_icon();
    return 'focus-windows-symbolic';
}

function _switchWorkspaceResult(switchQuery) {
    const manager = global.workspace_manager;
    if (!workspaceIndexInRange(switchQuery.index, manager.get_n_workspaces()))
        return null;
    const workspace = manager.get_workspace_by_index(switchQuery.index);
    if (!workspace)
        return null;
    return {
        type: 'workspace',
        title: workspaceSwitchTitle(switchQuery.number),
        description: 'Workspace',
        icon: 'view-app-grid-symbolic',
        activate: () => {
            const current = global.workspace_manager.get_workspace_by_index(switchQuery.index);
            if (!current)
                return;
            current.activate(global.get_current_time());
        },
    };
}

export function searchWindows(query, maxResults) {
    const closeQuery = parseWindowCloseQuery(query);
    const switchQuery = closeQuery ? null : parseWorkspaceSwitchQuery(query);
    const q = (closeQuery ? closeQuery.title : query).toLowerCase();
    const results = [];
    if (switchQuery) {
        const row = _switchWorkspaceResult(switchQuery);
        if (row)
            results.push(row);
    }
    const tabRanks = _tabRanks();
    const windows = sortWindowsMostRecent(_metaWindows(), win => {
        if (tabRanks.has(win))
            return tabRanks.get(win);
        return windowRecencyValue(-1, 0, win.get_user_time());
    });

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
        const title = win.get_title() || 'Untitled';
        const workspace = win.get_workspace();
        const description = windowWorkspaceLabel(
            workspace ? workspace.index() : -1,
            win.is_on_all_workspaces(),
        );
        if (!windowMatches(title, wmClass, q, description))
            continue;

        results.push({
            type: closeQuery ? 'window-close' : 'window',
            title: closeQuery ? windowCloseTitle(closeQuery.intent, title) : title,
            description,
            icon: _windowIcon(win),
            activate: () => {
                if (!win.get_workspace())
                    return;
                if (!closeQuery) {
                    Main.activateWindow(win);
                    return;
                }
                // kill is force quit delete is the same request as the window menu
                if (shouldForceQuitWindow(closeQuery.intent))
                    win.kill();
                else
                    win.delete(global.get_current_time());
            },
        });

        if (results.length >= maxResults)
            break;
    }

    return results;
}
