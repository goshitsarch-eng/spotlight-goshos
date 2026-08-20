// gosh is launcher - refresh results when windows or apps change
// SPDX-License-Identifier: GPL-3.0-or-later

import Shell from 'gi://Shell';
import {listMetaWindows} from './windowSearch.js';

// window-created is on global.display so the id is stored and dropped in stop
// unmanaged is per window connectobject is enough for those
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/src/shell-window-tracker.c
export class LiveSearchWatcher {
    constructor(onChange) {
        this._onChange = onChange;
        this._listening = false;
        this._createdId = 0;
        this._windows = [];
        this._appSystem = null;
        this._workspaces = null;
    }

    get listening() {
        return this._listening;
    }

    start() {
        if (this._listening)
            return;
        this._listening = true;

        this._createdId = global.display.connect('window-created', (_display, win) => {
            this._trackWindow(win);
            this._onChange();
        });

        for (const win of listMetaWindows())
            this._trackWindow(win);

        this._workspaces = global.workspace_manager;
        this._workspaces.connectObject(
            'active-workspace-changed', () => this._onChange(),
            'notify::n-workspaces', () => this._onChange(),
            this,
        );

        this._appSystem = Shell.AppSystem.get_default();
        this._appSystem.connectObject(
            'installed-changed', () => this._onChange(),
            this,
        );
    }

    stop() {
        if (!this._listening)
            return;

        if (this._createdId) {
            global.display.disconnect(this._createdId);
            this._createdId = 0;
        }
        for (const win of this._windows)
            win.disconnectObject(this);
        this._windows = [];

        if (this._workspaces) {
            this._workspaces.disconnectObject(this);
            this._workspaces = null;
        }
        if (this._appSystem) {
            this._appSystem.disconnectObject(this);
            this._appSystem = null;
        }
        this._listening = false;
    }

    _trackWindow(win) {
        if (!win)
            return;
        win.connectObject('unmanaged', () => {
            this._forgetWindow(win);
            this._onChange();
        }, this);
        this._windows.push(win);
    }

    _forgetWindow(win) {
        this._windows = this._windows.filter(tracked => tracked !== win);
    }
}
