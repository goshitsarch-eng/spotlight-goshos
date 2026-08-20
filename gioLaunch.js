// gosh is launcher - spawn and uri launch that always finishes gio async
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {firstCommandArg, commandIsReady} from './commandReady.js';

export function spawnArgv(argv) {
    const exe = firstCommandArg(argv);
    if (!commandIsReady(
        exe,
        name => GLib.find_program_in_path(name),
        path => Gio.File.new_for_path(path).query_exists(null),
    ))
        return;

    const proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.NONE);
    // wait_async holds the subprocess until exit so gc cannot SIGTERM it
    proc.wait_async(null, (p, res) => {
        p.wait_finish(res);
    });
}

export function openUri(uri) {
    // timestamp 0 workspace -1 is the same launch context shell.apps use
    const context = global.create_app_launch_context(0, -1);
    Gio.AppInfo.launch_default_for_uri_async(uri, context, null, (_src, res) => {
        Gio.AppInfo.launch_default_for_uri_finish(res);
    });
}
