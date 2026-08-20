// gosh is launcher - runs a search and renders the result rows
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import {buildResultRow} from './resultRow.js';
import {buildSectionHeader} from './sectionHeader.js';
import {buildNoResults} from './noResults.js';
import {getSectionTitle} from './sectionTitles.js';
import {runSearch, runEmptySuggestions} from './searchController.js';
import {isActiveSearchQuery, planSearch, flagsFromSettings, shouldRefreshRecentFiles, shouldRefreshPath} from './searchPlan.js';
import {getTheme, iconSizeForLook} from './themes.js';
import {ensureRecentFiles} from './recentFilesSearch.js';
import {ensurePath} from './pathSearch.js';

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
        this._generation = 0;
        this._lastQuery = '';
    }

    _clearSearchIdle() {
        if (this._searchIdleId) {
            GLib.source_remove(this._searchIdleId);
            this._searchIdleId = 0;
        }
    }

    _rowOptions() {
        const density = this._settings.get_string('row-density');
        const theme = getTheme(this._settings.get_string('launcher-theme'));
        return {
            density,
            iconSize: iconSizeForLook(theme.look, density),
            showIcons: this._settings.get_boolean('show-result-icons'),
            showDescriptions: this._settings.get_boolean('show-descriptions'),
            showNumbers: this._settings.get_boolean('show-result-numbers'),
        };
    }

    onTextChanged(text) {
        this._lastQuery = text;
        this._clearSearchIdle();

        if (text.trim().length === 0) {
            this._showEmptyState();
            return;
        }

        this._searchIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._searchIdleId = 0;
            this._runSearch();
            return GLib.SOURCE_REMOVE;
        });
    }

    _showEmptyState() {
        this._generation += 1;
        const suggestions = runEmptySuggestions(this._settings);
        if (suggestions.length === 0) {
            this.reset();
            return;
        }
        this._paint(suggestions, '');
    }

    _runSearch() {
        this._generation += 1;
        const query = this._lastQuery;
        if (!isActiveSearchQuery(query)) {
            this._showEmptyState();
            return;
        }
        this._paint(runSearch(query, this._settings), query.trim());
        const plan = planSearch(query, flagsFromSettings(this._settings));
        const gen = this._generation;
        const refresh = () => {
            if (gen !== this._generation)
                return;
            const latest = this._lastQuery;
            if (!isActiveSearchQuery(latest))
                return;
            this._paint(runSearch(latest, this._settings), latest.trim());
        };
        if (shouldRefreshRecentFiles(this._settings.get_boolean('enable-recent-files'), plan))
            ensureRecentFiles(refresh);
        if (shouldRefreshPath(this._settings.get_boolean('enable-path-open'), plan))
            ensurePath(plan.query, refresh);
    }

    _paint(results, query) {
        this._selection.setResults(results);
        this._resultsBox.destroy_all_children();

        if (this._selection.results.length === 0) {
            this._resultsBox.add_child(buildNoResults(query));
        } else {
            this._renderResults();
            this._selection.applySelection(0, true);
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
        this._generation += 1;
        this._selection.setResults([]);
        this._resultsBox.destroy_all_children();
        this._resultsScroll.hide();
    }

    destroy() {
        this._clearSearchIdle();
        this._generation += 1;
    }
}
