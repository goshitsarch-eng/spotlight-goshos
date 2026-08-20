// gosh is launcher - web search preferences page
// SPDX-License-Identifier: GPL-3.0-or-later

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import {SEARCH_ENGINES} from '../webEngines.js';

export function buildWebSearchPage(settings) {
    const group = new Adw.PreferencesGroup({
        title: 'Web Search',
        description: 'Web search appears when nothing else matches, or immediately with the @ prefix',
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

    const currentEngine = settings.get_string('web-search-engine');
    const engineIndex = SEARCH_ENGINES.findIndex(e => e.id === currentEngine);
    if (engineIndex >= 0)
        engineRow.selected = engineIndex;

    engineRow.connect('notify::selected', () => {
        const selected = SEARCH_ENGINES[engineRow.selected];
        if (selected)
            settings.set_string('web-search-engine', selected.id);
    });

    group.add(engineRow);
    return [group];
}
