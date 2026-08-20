// gosh is launcher - no results widget
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import {ellipsizeLabel} from './labelEllipsize.js';

// creates the empty state widget shown when search returns nothing
export function buildNoResults(query) {
    const box = new St.BoxLayout({
        vertical: true,
        style_class: 'gosh-no-results',
    });
    box.add_child(new St.Label({
        style_class: 'gosh-no-results-title',
        text: 'No Results',
    }));
    const detail = new St.Label({
        text: `No results for "${query}"`,
    });
    ellipsizeLabel(detail);
    box.add_child(detail);
    return box;
}
