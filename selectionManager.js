// gosh is launcher - tracks which result row is selected and keeps it visible
// SPDX-License-Identifier: GPL-3.0-or-later

import {nextSelectedIndex} from './selectionMath.js';
import {getVerticalAdjustment} from './scrollView.js';

// owns the results array and selected index so launcherPopup.js does not
// need to touch selection state directly - it calls setResults() after a
// search and moveSelection()/applySelection() in response to input
export class SelectionManager {
    constructor(resultsBox, resultsScroll) {
        this._resultsBox = resultsBox;
        this._resultsScroll = resultsScroll;
        this._results = [];
        this._selectedIndex = -1;
    }

    get results() {
        return this._results;
    }

    get selectedIndex() {
        return this._selectedIndex;
    }

    // replaces the results list and resets selection - called once per
    // search, before the caller renders the new rows into resultsBox
    setResults(results) {
        this._results = results;
        this._selectedIndex = -1;
    }

    // applies the selection style, and scrolls the row into view unless
    // skipScroll is set - used right after a fresh render where rows have
    // not been through a layout pass yet, so they have no allocation box
    // to scroll to (and none is needed, since a freshly rendered list is
    // already scrolled to the top where row 0 lives)
    applySelection(index, skipScroll = false) {
        if (this._selectedIndex >= 0 && this._selectedIndex < this._results.length) {
            const oldRow = this._getResultRow(this._selectedIndex);
            if (oldRow)
                oldRow.remove_style_class_name('gosh-selected');
        }

        this._selectedIndex = index;

        if (index >= 0 && index < this._results.length) {
            const newRow = this._getResultRow(index);
            if (newRow) {
                newRow.add_style_class_name('gosh-selected');
                if (!skipScroll)
                    this._scrollRowIntoView(newRow);
            }
        }
    }

    moveSelection(delta, suppressHoverUntil) {
        if (this._results.length === 0)
            return;
        const newIndex = nextSelectedIndex(
            this._selectedIndex, delta, this._results.length);
        if (newIndex < 0)
            return;
        // suppress hover selection briefly after keyboard navigation
        // prevents scroll-induced enter-events from overwriting the selection
        // the caller owns the actual suppression window, this just applies it
        suppressHoverUntil();
        this.applySelection(newIndex);
    }

    _scrollRowIntoView(row) {
        const adjustment = getVerticalAdjustment(this._resultsScroll);
        const box = row.get_allocation_box();
        const rowY = box.y1;
        const rowHeight = box.get_height();
        if (rowY < adjustment.value)
            adjustment.value = rowY;
        else if (rowY + rowHeight > adjustment.value + adjustment.page_size)
            adjustment.value = rowY + rowHeight - adjustment.page_size;
    }

    _getResultRow(resultIndex) {
        for (const child of this._resultsBox.get_children()) {
            if (child._resultIndex === resultIndex)
                return child;
        }
        return null;
    }
}
