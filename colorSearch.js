// gosh is launcher - hex color copy
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import {normalizeHexColor} from './colorMatch.js';

export function searchColor(query) {
    const hex = normalizeHexColor(query);
    if (!hex)
        return [];

    return [{
        type: 'color',
        title: hex,
        description: 'Press Enter to copy color',
        icon: 'color-select-symbolic',
        activate: () => {
            // clipboard write only after the user activates a color
            // declared in metadata.json description
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, hex);
            clipboard.set_text(St.ClipboardType.PRIMARY, hex);
        },
    }];
}
