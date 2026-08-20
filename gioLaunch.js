// gosh is launcher - spawn and uri launch that always finishes gio async
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';

export function spawnArgv(argv) {
    const proc = Gio.Subprocess.new(argv, Gio.SubprocessFlags.NONE);
    // wait_async holds the subprocess until exit so gc cannot SIGTERM it
    proc.wait_async(null, (p, res) => {
        p.wait_finish(res);
    });
}

export function openUri(uri) {
    Gio.AppInfo.launch_default_for_uri_async(uri, null, null, (_src, res) => {
        Gio.AppInfo.launch_default_for_uri_finish(res);
    });
}
