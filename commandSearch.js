// gosh is launcher - run command provider
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';

// only offered when the user used the ! prefix so ordinary searches
// never spawn a shell
export function searchCommand(query) {
    if (query.length === 0)
        return [];

    return [{
        type: 'command',
        title: query,
        description: 'Run command',
        icon: 'utilities-terminal-symbolic',
        activate: () => {
            GLib.spawn_command_line_async(query);
        },
    }];
}
