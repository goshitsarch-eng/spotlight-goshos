// gosh is launcher - path result rows without gio
// SPDX-License-Identifier: GPL-3.0-or-later

import {basenameFromUri, iconForBasename} from './recentXbel.js';

export function pathRowMeta(trimmed, resolved, kind) {
    if (kind === 'missing') {
        return {
            type: 'path',
            title: trimmed,
            description: 'Path not found',
            icon: 'dialog-warning-symbolic',
        };
    }

    const icon = kind === 'directory'
        ? 'folder-symbolic'
        : iconForBasename(basenameFromUri(resolved));
    return {
        type: 'path',
        title: resolved,
        description: 'Open path',
        icon,
    };
}
