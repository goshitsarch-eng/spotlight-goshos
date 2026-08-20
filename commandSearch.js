// gosh is launcher - run command provider
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {firstCommandArg, commandIsReady} from './commandReady.js';
import {spawnArgv} from './gioLaunch.js';

function _commandReady(argv) {
    return commandIsReady(
        firstCommandArg(argv),
        name => GLib.find_program_in_path(name),
        path => Gio.File.new_for_path(path).query_exists(null),
    );
}

// only offered when the user used the ! prefix so ordinary searches
// never spawn a process
export function searchCommand(query) {
    if (query.length === 0)
        return [];

    const [ok, argv] = GLib.shell_parse_argv(query);
    if (!ok || argv.length === 0)
        return [];

    if (!_commandReady(argv)) {
        return [{
            type: 'command',
            title: query,
            description: 'Command not found',
            icon: 'dialog-warning-symbolic',
            activate: () => {},
        }];
    }

    return [{
        type: 'command',
        title: query,
        description: 'Run command',
        icon: 'utilities-terminal-symbolic',
        activate: () => spawnArgv(argv),
    }];
}
