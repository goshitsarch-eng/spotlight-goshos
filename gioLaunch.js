// gosh is launcher - spawn and uri launch that always finishes gio async
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {firstCommandArg, commandUsesPathLookup} from './commandReady.js';
import {resolveCommandArgv, canonicalizeLaunchUri} from './homePath.js';
import {extraPathDirs, findUserProgram, joinPathDirs} from './userPath.js';
import {isUnsafeLaunchUri} from './urlMatch.js';

// findUserProgram walks the shell PATH with find_program_in_path and stats
// extra dirs with file_test both synchronous on the compositor thread
// searchPlaces searchPath searchSettings and searchCommand probe this on
// every keystroke and terminalSpec alone tries up to eleven binaries so a
// single search can fire dozens of blocking calls and stutter the desktop
// program locations do not change within a session so cache hits and misses
const _programPathCache = new Map();

export function resetProgramPathCache() {
    _programPathCache.clear();
}

export function findInUserPath(name) {
    if (_programPathCache.has(name))
        return _programPathCache.get(name);
    const home = GLib.get_home_dir() || '';
    const found = findUserProgram(
        name,
        n => GLib.find_program_in_path(n),
        p => GLib.file_test(p, GLib.FileTest.IS_EXECUTABLE),
        extraPathDirs(home),
    );
    _programPathCache.set(name, found);
    return found;
}

export function spawnArgv(argv, cwd) {
    const home = GLib.get_home_dir() || '';
    const resolved = resolveCommandArgv(argv, home);
    const exe = firstCommandArg(resolved);
    if (commandUsesPathLookup(exe)) {
        const found = findInUserPath(exe);
        if (!found)
            return;
        resolved[0] = found;
    }

    const launcher = new Gio.SubprocessLauncher({
        flags: Gio.SubprocessFlags.NONE,
    });
    // gnome-shell cwd is often / so run the command from the user home
    // a directory opener can pass cwd so xdg-terminal-exec starts there
    const workdir = cwd || home;
    if (workdir)
        launcher.set_cwd(workdir);
    const path = joinPathDirs(extraPathDirs(home), GLib.getenv('PATH') || '');
    if (path)
        launcher.setenv('PATH', path, true);
    let proc;
    // spawnv raises gerror if the binary vanished after the ready check
    try {
        proc = launcher.spawnv(resolved);
    } catch (e) {
        return;
    }
    // wait_async holds the subprocess until exit so gc cannot SIGTERM it
    proc.wait_async(null, (p, res) => {
        try {
            p.wait_finish(res);
        } catch (e) {
            // finish must run so the async result is consumed
        }
    });
}

export function openUri(uri) {
    if (!uri || isUnsafeLaunchUri(uri))
        return;
    const launch = canonicalizeLaunchUri(uri);
    // timestamp 0 workspace -1 is the same launch context shell.apps use
    const context = global.create_app_launch_context(0, -1);
    Gio.AppInfo.launch_default_for_uri_async(launch, context, null, (_src, res) => {
        try {
            Gio.AppInfo.launch_default_for_uri_finish(res);
        } catch (e) {
            // finish must run so the async result is consumed
        }
    });
}
