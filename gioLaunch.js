// gosh is launcher - spawn and uri launch that always finishes gio async
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {firstCommandArg, commandUsesPathLookup} from './commandReady.js';
import {resolveCommandArgv} from './homePath.js';
import {extraPathDirs, findUserProgram, joinPathDirs} from './userPath.js';
import {isUnsafeLaunchUri} from './urlMatch.js';

export function findInUserPath(name) {
    const home = GLib.get_home_dir() || '';
    return findUserProgram(
        name,
        n => GLib.find_program_in_path(n),
        p => GLib.file_test(p, GLib.FileTest.IS_EXECUTABLE),
        extraPathDirs(home),
    );
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
    // timestamp 0 workspace -1 is the same launch context shell.apps use
    const context = global.create_app_launch_context(0, -1);
    Gio.AppInfo.launch_default_for_uri_async(uri, context, null, (_src, res) => {
        try {
            Gio.AppInfo.launch_default_for_uri_finish(res);
        } catch (e) {
            // finish must run so the async result is consumed
        }
    });
}
