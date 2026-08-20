// gosh is launcher - run command provider
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

// only offered when the user used the ! prefix so ordinary searches
// never spawn a process
export function searchCommand(query) {
    if (query.length === 0)
        return [];

    return [{
        type: 'command',
        title: query,
        description: 'Run command',
        icon: 'utilities-terminal-symbolic',
        activate: () => {
            const [ok, argv] = GLib.shell_parse_argv(query);
            if (!ok || argv.length === 0)
                return;
            Gio.Subprocess.new(argv, Gio.SubprocessFlags.NONE);
        },
    }];
}
