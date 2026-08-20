// gosh is launcher - appearance preferences page
// SPDX-License-Identifier: GPL-3.0-or-later

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import {THEMES, getTheme} from '../themes.js';

const POSITIONS = [
    {id: 'center', label: 'Center'},
    {id: 'top', label: 'Top'},
];

const DENSITIES = [
    {id: 'comfortable', label: 'Comfortable'},
    {id: 'compact', label: 'Compact'},
];

function bindCombo(row, settings, key, items) {
    const current = settings.get_string(key);
    const index = items.findIndex(item => item.id === current);
    if (index >= 0)
        row.selected = index;

    row.connect('notify::selected', () => {
        const selected = items[row.selected];
        if (selected)
            settings.set_string(key, selected.id);
    });
}

export function buildAppearancePage(settings) {
    const lookGroup = new Adw.PreferencesGroup({
        title: 'Look',
        description: 'Pick a launcher style. Omarchy follows Walker on Omarchy Linux. Pop!_OS follows the COSMIC launcher.',
    });

    const themeModel = new Gtk.StringList();
    for (const theme of THEMES)
        themeModel.append(theme.title);

    const themeRow = new Adw.ComboRow({
        title: 'Launcher look',
        subtitle: getTheme(settings.get_string('launcher-theme')).description,
        model: themeModel,
    });

    const positionModel = new Gtk.StringList();
    for (const pos of POSITIONS)
        positionModel.append(pos.label);
    const positionRow = new Adw.ComboRow({
        title: 'Position',
        subtitle: 'Center stays put and grows down. Top matches Pop!_OS and KRunner',
        model: positionModel,
    });

    bindCombo(themeRow, settings, 'launcher-theme', THEMES);
    bindCombo(positionRow, settings, 'popup-position', POSITIONS);
    themeRow.connect('notify::selected', () => {
        const theme = THEMES[themeRow.selected];
        if (!theme)
            return;
        themeRow.subtitle = theme.description;
        const posIndex = POSITIONS.findIndex(p => p.id === theme.defaultPosition);
        if (posIndex >= 0)
            positionRow.selected = posIndex;
    });
    lookGroup.add(themeRow);
    lookGroup.add(positionRow);

    const densityModel = new Gtk.StringList();
    for (const density of DENSITIES)
        densityModel.append(density.label);
    const densityRow = new Adw.ComboRow({
        title: 'Row density',
        model: densityModel,
    });
    bindCombo(densityRow, settings, 'row-density', DENSITIES);
    lookGroup.add(densityRow);

    const sizeGroup = new Adw.PreferencesGroup({
        title: 'Size',
    });

    const widthRow = new Adw.SpinRow({
        title: 'Popup width',
        subtitle: 'Width in pixels',
        adjustment: new Gtk.Adjustment({
            lower: 400,
            upper: 1200,
            step_increment: 20,
            page_increment: 100,
            value: settings.get_int('popup-width'),
        }),
    });
    settings.bind('popup-width', widthRow, 'value', Gio.SettingsBindFlags.DEFAULT);
    sizeGroup.add(widthRow);

    const heightRow = new Adw.SpinRow({
        title: 'Results max height',
        subtitle: 'Scroll after this height',
        adjustment: new Gtk.Adjustment({
            lower: 160,
            upper: 800,
            step_increment: 20,
            page_increment: 80,
            value: settings.get_int('results-max-height'),
        }),
    });
    settings.bind('results-max-height', heightRow, 'value', Gio.SettingsBindFlags.DEFAULT);
    sizeGroup.add(heightRow);

    const maxResultsRow = new Adw.SpinRow({
        title: 'Max results per category',
        adjustment: new Gtk.Adjustment({
            lower: 1,
            upper: 20,
            step_increment: 1,
            page_increment: 5,
            value: settings.get_int('max-results'),
        }),
    });
    settings.bind('max-results', maxResultsRow, 'value', Gio.SettingsBindFlags.DEFAULT);
    sizeGroup.add(maxResultsRow);

    const chromeGroup = new Adw.PreferencesGroup({
        title: 'Chrome',
    });

    const iconRow = new Adw.SwitchRow({
        title: 'Search icon',
        subtitle: 'Magnifying glass in the entry',
    });
    settings.bind('show-search-icon', iconRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    chromeGroup.add(iconRow);

    const headersRow = new Adw.SwitchRow({
        title: 'Section headers',
        subtitle: 'Category labels above result groups',
    });
    settings.bind('show-section-headers', headersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    chromeGroup.add(headersRow);

    const resultIconsRow = new Adw.SwitchRow({
        title: 'Result icons',
    });
    settings.bind('show-result-icons', resultIconsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    chromeGroup.add(resultIconsRow);

    const descriptionsRow = new Adw.SwitchRow({
        title: 'Result descriptions',
    });
    settings.bind('show-descriptions', descriptionsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    chromeGroup.add(descriptionsRow);

    const numbersRow = new Adw.SwitchRow({
        title: 'Number hints',
        subtitle: 'Show 1-9 and activate with Alt+digit',
    });
    settings.bind('show-result-numbers', numbersRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    chromeGroup.add(numbersRow);

    return [lookGroup, sizeGroup, chromeGroup];
}
