// gosh is launcher - runs a search and renders the result rows
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import {buildResultRow} from './resultRow.js';
import {buildSectionHeader} from './sectionHeader.js';
import {buildNoResults} from './noResults.js';
import {getSectionTitle} from './sectionTitles.js';
import {runSearch, runEmptySuggestions} from './searchController.js';
import {isActiveSearchQuery, planSearch, flagsFromSettings, shouldRefreshRecentFiles, shouldRefreshPath, shouldRefreshCommand, shouldRefreshBookmarks} from './searchPlan.js';
import {iconSizeForLook} from './themes.js';
import {ensureRecentFiles} from './recentFilesSearch.js';
import {ensurePath, invalidatePathLookup} from './pathSearch.js';
import {ensureCommand, invalidateCommandLookup} from './commandSearch.js';
import {ensureBookmarks} from './bookmarksSearch.js';
import {paintSelectionIndex, resultSelectionKey} from './paintSelection.js';

// debounces search-as-you-type and turns results into row widgets - owns
// the search idle source and calls into a SelectionManager for anything
// selection-related, it does not touch selection state directly
export class ResultsRenderer {
    constructor(resultsBox, resultsScroll, selection, settings, onActivate, onHover) {
        this._resultsBox = resultsBox;
        this._resultsScroll = resultsScroll;
        this._selection = selection;
        this._settings = settings;
        this._onActivate = onActivate;
        this._onHover = onHover;
        this._searchIdleId = 0;
        this._scrollIdleId = 0;
        this._generation = 0;
        this._lastQuery = '';
    }

    _clearSearchIdle() {
        if (this._searchIdleId) {
            GLib.source_remove(this._searchIdleId);
            this._searchIdleId = 0;
        }
    }

    _clearScrollIdle() {
        if (this._scrollIdleId) {
            GLib.source_remove(this._scrollIdleId);
            this._scrollIdleId = 0;
        }
    }

    _rowOptions() {
        const density = this._settings.get_string('row-density');
        return {
            density,
            iconSize: iconSizeForLook({iconSize: this._settings.get_int('icon-size')}, density),
            showIcons: this._settings.get_boolean('show-result-icons'),
            showDescriptions: this._settings.get_boolean('show-descriptions'),
            showNumbers: this._settings.get_boolean('show-result-numbers'),
        };
    }

    onTextChanged(text) {
        this._lastQuery = text;
        this._clearSearchIdle();
        // empty paint used to run inside the key handler clutter 18 aborts
        this._searchIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._searchIdleId = 0;
            if (this._lastQuery.trim().length === 0)
                this._showEmptyState(false);
            else
                this._runSearch(false);
            return GLib.SOURCE_REMOVE;
        });
    }

    // prefs chrome and feature flags should not jump the highlight to row 0
    repaintKeepingSelection() {
        this._clearSearchIdle();
        if (this._lastQuery.trim().length === 0) {
            this._showEmptyState(true);
            return;
        }
        this._runSearch(true);
    }

    _showEmptyState(keepSelection) {
        invalidatePathLookup();
        invalidateCommandLookup();
        this._generation += 1;
        const suggestions = runEmptySuggestions(this._settings);
        if (suggestions.length === 0) {
            this.reset();
            return;
        }
        this._paint(suggestions, '', keepSelection);
    }

    _runSearch(keepSelection) {
        this._generation += 1;
        const query = this._lastQuery;
        if (!isActiveSearchQuery(query)) {
            this._showEmptyState(keepSelection);
            return;
        }
        this._paint(runSearch(query, this._settings), query.trim(), keepSelection);
        const plan = planSearch(query, flagsFromSettings(this._settings));
        if (!shouldRefreshPath(this._settings.get_boolean('enable-path-open'), plan))
            invalidatePathLookup();
        if (!shouldRefreshCommand(this._settings.get_boolean('enable-command-run'), plan))
            invalidateCommandLookup();
        const gen = this._generation;
        const refresh = () => {
            if (gen !== this._generation)
                return;
            const latest = this._lastQuery;
            if (!isActiveSearchQuery(latest))
                return;
            this._paint(runSearch(latest, this._settings), latest.trim(), true);
        };
        if (shouldRefreshRecentFiles(this._settings.get_boolean('enable-recent-files'), plan))
            ensureRecentFiles(refresh);
        if (shouldRefreshPath(this._settings.get_boolean('enable-path-open'), plan))
            ensurePath(plan.query, refresh);
        if (shouldRefreshCommand(this._settings.get_boolean('enable-command-run'), plan))
            ensureCommand(plan.query, refresh);
        if (shouldRefreshBookmarks(this._settings.get_boolean('enable-bookmarks'), plan))
            ensureBookmarks(refresh);
    }

    _selectedKey() {
        const index = this._selection.selectedIndex;
        const result = this._selection.results[index];
        if (!result)
            return null;
        return resultSelectionKey(result, index);
    }

    // allocation is empty until this paint returns so scroll on the next idle
    _queueScrollSelected() {
        this._clearScrollIdle();
        this._scrollIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._scrollIdleId = 0;
            const index = this._selection.selectedIndex;
            if (index > 0)
                this._selection.applySelection(index);
            return GLib.SOURCE_REMOVE;
        });
    }

    _paint(results, query, keepSelection) {
        this._clearScrollIdle();
        const previous = keepSelection ? this._selectedKey() : null;
        this._selection.setResults(results);
        this._resultsBox.destroy_all_children();

        if (this._selection.results.length === 0) {
            this._resultsBox.add_child(buildNoResults(query));
        } else {
            this._renderResults();
            const index = paintSelectionIndex(previous, results);
            this._selection.applySelection(index, true);
            if (keepSelection && index > 0)
                this._queueScrollSelected();
        }

        this._resultsScroll.show();
    }

    _renderResults() {
        const showHeaders = this._settings.get_boolean('show-section-headers');
        const options = this._rowOptions();
        let lastType = null;
        let rowIndex = 0;
        for (const result of this._selection.results) {
            if (showHeaders && result.type !== lastType) {
                lastType = result.type;
                this._resultsBox.add_child(buildSectionHeader(getSectionTitle(result.type)));
            }
            this._resultsBox.add_child(
                buildResultRow(result, rowIndex, this._onActivate, this._onHover, options)
            );
            rowIndex++;
        }
    }

    reset() {
        this._clearSearchIdle();
        this._clearScrollIdle();
        this._generation += 1;
        this._lastQuery = '';
        this._selection.setResults([]);
        this._resultsBox.destroy_all_children();
        this._resultsScroll.hide();
    }

    destroy() {
        this._clearSearchIdle();
        this._clearScrollIdle();
        this._generation += 1;
    }
}
