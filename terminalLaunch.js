// gosh is launcher - pick a terminal command for a directory
// SPDX-License-Identifier: GPL-3.0-or-later

import {collapseHomePath} from './homePath.js';

export function terminalSpec(findInPath) {
    if (findInPath('xdg-terminal-exec'))
        return {argv: ['xdg-terminal-exec'], useDirectoryCwd: true};
    if (findInPath('ptyxis'))
        return {argv: ['ptyxis', '--new-window'], workingDirectoryFlag: '--working-directory'};
    if (findInPath('kgx'))
        return {argv: ['kgx'], workingDirectoryFlag: '--working-directory'};
    if (findInPath('gnome-terminal'))
        return {argv: ['gnome-terminal'], workingDirectoryFlag: '--working-directory'};
    return null;
}

export function terminalCommand(findInPath, directory) {
    const spec = terminalSpec(findInPath);
    if (!spec || !directory)
        return null;
    if (spec.useDirectoryCwd)
        return {argv: spec.argv.slice(), cwd: directory};
    return {
        argv: spec.argv.concat([`${spec.workingDirectoryFlag}=${directory}`]),
        cwd: null,
    };
}

export function terminalRowMeta(directory, home, type) {
    return {
        type: type || 'path',
        title: 'Open in Terminal',
        description: collapseHomePath(directory, home || ''),
        icon: 'utilities-terminal-symbolic',
    };
}
