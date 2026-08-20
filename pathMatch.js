// gosh is launcher - path result rows without gio
// SPDX-License-Identifier: GPL-3.0-or-later

import {basenameFromUri, iconForBasename} from './recentXbel.js';
import {collapseHomePath} from './homePath.js';

export function pathRowMeta(trimmed, resolved, kind, home) {
    if (kind === 'missing') {
        return {
            type: 'path',
            title: trimmed,
            description: 'Path not found',
            icon: 'dialog-warning-symbolic',
            activatable: false,
        };
    }
    if (kind === 'pending') {
        return {
            type: 'path',
            title: collapseHomePath(resolved, home || ''),
            description: 'Checking path',
            icon: 'folder-symbolic',
            activatable: false,
        };
    }

    const icon = kind === 'directory'
        ? 'folder-symbolic'
        : iconForBasename(basenameFromUri(resolved));
    return {
        type: 'path',
        title: collapseHomePath(resolved, home || ''),
        description: 'Open path',
        icon,
    };
}
