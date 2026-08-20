// gosh is launcher - unit conversion provider
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import {convertQuery} from './unitMatch.js';

export function searchUnits(query) {
    const converted = convertQuery(query);
    if (!converted)
        return [];

    return [{
        type: 'unit',
        title: converted.title,
        description: `${converted.description} · press Enter to copy`,
        icon: 'accessories-calculator-symbolic',
        activate: () => {
            // clipboard write only after the user activates a conversion
            // declared in metadata.json description
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, converted.title);
            clipboard.set_text(St.ClipboardType.PRIMARY, converted.title);
        },
    }];
}
