// gosh is launcher - results container widget
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import {attachScrollChild, applyScrollPolicy, setOverlayScrollbars} from './scrollView.js';
import {popupChromeShouldFocus} from './focusLoss.js';

// creates the scrollable results container
export function buildResultsContainer(settings) {
    const resultsScroll = new St.ScrollView({
        style_class: 'gosh-results',
        visible: false,
        x_expand: true,
        can_focus: popupChromeShouldFocus(),
        style: `max-height: ${settings.get_int('results-max-height')}px;`,
    });
    applyScrollPolicy(resultsScroll, St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);
    setOverlayScrollbars(resultsScroll, false);
    const resultsBox = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        y_expand: true,
    });
    attachScrollChild(resultsScroll, resultsBox);
    return {resultsScroll, resultsBox};
}
