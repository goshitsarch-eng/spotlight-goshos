// gosh is launcher - keep labels on one line inside a fixed-width popup
// SPDX-License-Identifier: GPL-3.0-or-later

import Pango from 'gi://Pango';

// long window titles must not widen the popup past popup-width
export function ellipsizeLabel(label) {
    const text = label.clutter_text;
    text.ellipsize = Pango.EllipsizeMode.END;
    text.single_line_mode = true;
    label.x_expand = true;
}
