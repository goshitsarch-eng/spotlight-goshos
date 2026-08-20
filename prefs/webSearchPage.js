// gosh is launcher - web search preferences page
// SPDX-License-Identifier: GPL-3.0-or-later

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import {SEARCH_ENGINES, enginePrefsSearchText} from '../webEngines.js';
import {bindSettingsCombo} from '../prefsCombo.js';

export function buildWebSearchPage(settings) {
    const group = new Adw.PreferencesGroup({
        title: 'Web Search',
        description: `Web search appears when nothing else matches, or immediately with the @ prefix. ${enginePrefsSearchText()}`,
    });

    const webSearchRow = new Adw.SwitchRow({
        title: 'Show web search fallback',
        subtitle: 'When nothing local matches. The @ prefix still searches the web',
    });
    settings.bind('show-web-search', webSearchRow, 'active',
        Gio.SettingsBindFlags.DEFAULT);
    group.add(webSearchRow);

    const engineModel = new Gtk.StringList();
    for (const engine of SEARCH_ENGINES)
        engineModel.append(engine.label);

    const engineRow = new Adw.ComboRow({
        title: 'Search engine',
        model: engineModel,
    });

    bindSettingsCombo(engineRow, settings, 'web-search-engine', SEARCH_ENGINES);

    group.add(engineRow);
    return [group];
}
