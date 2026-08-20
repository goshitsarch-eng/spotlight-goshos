// gosh is launcher - whether a parsed argv is safe to spawn
// SPDX-License-Identifier: GPL-3.0-or-later

// gio.subprocess.new throws if the executable is missing
// check first so activating !badcmd cannot throw and skip close

export function firstCommandArg(argv) {
    if (!argv || argv.length === 0)
        return '';
    const exe = argv[0];
    if (typeof exe !== 'string')
        return '';
    return exe;
}

// relative names go through PATH absolute and slash-containing names do not
export function commandUsesPathLookup(exe) {
    return exe.length > 0 && exe.indexOf('/') === -1;
}

export function commandIsReady(exe, findInPath, pathExists) {
    if (exe.length === 0)
        return false;
    if (commandUsesPathLookup(exe))
        return Boolean(findInPath(exe));
    return Boolean(pathExists(exe));
}

export function commandRowMeta(query, ready, checking = false) {
    if (checking) {
        return {
            type: 'command',
            title: query,
            description: 'Checking command',
            icon: 'utilities-terminal-symbolic',
            activatable: false,
        };
    }
    if (!ready) {
        return {
            type: 'command',
            title: query,
            description: 'Command not found',
            icon: 'dialog-warning-symbolic',
            activatable: false,
        };
    }
    return {
        type: 'command',
        title: query,
        description: 'Run command',
        icon: 'utilities-terminal-symbolic',
    };
}
