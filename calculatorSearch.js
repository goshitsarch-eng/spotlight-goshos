// gosh is launcher - calculator search provider
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import {evaluateArithmetic, formatNumber} from './calculator.js';

// returns a calculator result if the input is valid arithmetic
export function searchCalculator(query, allowBare) {
    const result = evaluateArithmetic(query, allowBare);
    if (result === null)
        return [];

    const formatted = formatNumber(result);
    return [{
        type: 'calculator',
        title: formatted,
        description: 'Press Enter to copy to clipboard',
        icon: 'accessories-calculator-symbolic',
        activate: () => {
            // clipboard write only - triggered by explicit user action on the calculator result
            // declared in metadata.json description
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, formatted);
            clipboard.set_text(St.ClipboardType.PRIMARY, formatted);
        },
    }];
}
