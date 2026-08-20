// gosh is launcher - keep labels on one line inside a fixed-width popup
// SPDX-License-Identifier: GPL-3.0-or-later

import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';

// fill a bounded allocation so ellipsize can run
// natural-width labels would stretch the row instead
export function ellipsizeLabel(label) {
    const text = label.clutter_text;
    text.ellipsize = Pango.EllipsizeMode.END;
    text.single_line_mode = true;
    label.x_expand = true;
    label.x_align = Clutter.ActorAlign.FILL;
}
