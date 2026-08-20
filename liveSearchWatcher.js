// gosh is launcher - refresh results when windows or apps change
// SPDX-License-Identifier: GPL-3.0-or-later

import Shell from 'gi://Shell';
import {listMetaWindows} from './windowSearch.js';
import {shouldTrackLiveWindow, windowsForLiveTrack} from './searchLive.js';

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

        // a vanished window or display must not abort open after chrome is up
        try {
            this._createdId = global.display.connect('window-created', (_display, win) => {
                this._trackWindow(win);
                this._onChange();
            });
        } catch (e) {
            this._createdId = 0;
        }

        for (const win of windowsForLiveTrack(listMetaWindows))
            this._trackWindow(win);

        this._workspaces = global.workspace_manager;
        try {
            this._workspaces.connectObject(
                'active-workspace-changed', () => this._onChange(),
                'notify::n-workspaces', () => this._onChange(),
                this,
            );
        } catch (e) {
            this._workspaces = null;
        }

        try {
            this._appSystem = Shell.AppSystem.get_default();
            this._appSystem.connectObject(
                'installed-changed', () => this._onChange(),
                'app-state-changed', () => this._onChange(),
                this,
            );
        } catch (e) {
            this._appSystem = null;
        }
    }

    stop() {
        if (!this._listening)
            return;

        if (this._createdId) {
            try {
                global.display.disconnect(this._createdId);
            } catch (e) {
                // display can vanish at session teardown
            }
            this._createdId = 0;
        }
        for (const win of this._windows) {
            try {
                win.disconnectObject(this);
            } catch (e) {
                // mutter can drop the window before stop
            }
        }
        this._windows = [];

        if (this._workspaces) {
            try {
                this._workspaces.disconnectObject(this);
            } catch (e) {
                // workspace manager can vanish at session teardown
            }
            this._workspaces = null;
        }
        if (this._appSystem) {
            try {
                this._appSystem.disconnectObject(this);
            } catch (e) {
                // appsystem can vanish at session teardown
            }
            this._appSystem = null;
        }
        this._listening = false;
    }

    _trackWindow(win) {
        if (!shouldTrackLiveWindow(win, this._windows))
            return;
        try {
            win.connectObject('unmanaged', () => {
                this._forgetWindow(win);
                this._onChange();
            }, this);
            this._windows.push(win);
        } catch (e) {
            // mutter can drop the window between list and connect
        }
    }

    _forgetWindow(win) {
        this._windows = this._windows.filter(tracked => tracked !== win);
    }
}
