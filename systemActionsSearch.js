// gosh is launcher - system actions search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import * as SystemActions from 'resource:///org/gnome/shell/misc/systemActions.js';
import * as Screenshot from 'resource:///org/gnome/shell/ui/screenshot.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {actionMatchesQuery} from './actionMatch.js';

// system actions using gnome shell's built-in systemactions module
// this is the recommended way per ego review guidelines
// getDefault() is called lazily inside each activate() callback so no
// instance is constructed at module load time (ego: only-use-initialization-for-static-resources)
const SYSTEM_ACTIONS = [
    {
        id: 'lock',
        title: 'Lock Screen',
        icon: 'changes-prevent-symbolic',
        keywords: ['lock', 'lockscreen', 'lock screen'],
        can: sa => sa.canLockScreen,
        activate: () => SystemActions.getDefault().activateLockScreen(),
    },
    {
        id: 'logout',
        title: 'Log Out',
        icon: 'system-log-out-symbolic',
        keywords: ['logout', 'signout', 'log out', 'sign out', 'log off'],
        can: sa => sa.canLogout,
        activate: () => SystemActions.getDefault().activateLogout(),
    },
    {
        id: 'suspend',
        title: 'Suspend',
        icon: 'weather-clear-night-symbolic',
        keywords: ['suspend', 'sleep'],
        can: sa => sa.canSuspend,
        activate: () => SystemActions.getDefault().activateSuspend(),
    },
    {
        id: 'restart',
        title: 'Restart',
        icon: 'system-reboot-symbolic',
        keywords: ['restart', 'reboot'],
        can: sa => sa.canRestart,
        activate: () => SystemActions.getDefault().activateRestart(),
    },
    {
        id: 'shutdown',
        title: 'Shut Down',
        icon: 'system-shutdown-symbolic',
        keywords: ['shutdown', 'poweroff', 'power off', 'turn off', 'halt'],
        can: sa => sa.canPowerOff,
        activate: () => SystemActions.getDefault().activatePowerOff(),
    },
    {
        id: 'switch-user',
        title: 'Switch User',
        icon: 'system-switch-user-symbolic',
        keywords: ['switch user', 'switchuser'],
        can: sa => sa.canSwitchUser,
        activate: () => SystemActions.getDefault().activateSwitchUser(),
    },
    {
        id: 'lock-orientation',
        title: 'Lock Screen Rotation',
        icon: 'rotation-locked-symbolic',
        keywords: ['rotation', 'orientation', 'rotate'],
        // gnome 50 still exports this tablets hide it when unmanaged
        can: sa => sa.canLockOrientation,
        activate: () => SystemActions.getDefault().activateLockOrientation(),
    },
    {
        id: 'screenshot',
        title: 'Take a Screenshot',
        icon: 'screenshooter-symbolic',
        keywords: ['screenshot', 'snip', 'capture', 'screencast'],
        can: () => true,
        // systemactions waits for overview hidden and never opens if
        // overview is already closed which is how the launcher is used
        activate: () => {
            if (Main.overview.visible) {
                SystemActions.getDefault().activateScreenshotUI();
                Main.overview.hide();
                return;
            }
            // showScreenshotUI is the 45-50 path if a later shell drops
            // the helper fall back to the systemactions entry
            if (typeof Screenshot.showScreenshotUI === 'function')
                Screenshot.showScreenshotUI();
            else
                SystemActions.getDefault().activateScreenshotUI();
        },
    },
];

// searches system actions by title and keywords
// availability is checked at search time so gnome 50 policy still applies
export function searchSystemActions(query, maxResults) {
    const sa = SystemActions.getDefault();
    const results = [];

    for (const action of SYSTEM_ACTIONS) {
        if (!action.can(sa))
            continue;
        if (!actionMatchesQuery(action, query))
            continue;

        results.push({
            type: 'system-action',
            title: action.title,
            description: 'System',
            icon: action.icon,
            activate: () => action.activate(),
        });

        if (results.length >= maxResults)
            break;
    }

    return results;
}
