// gosh is launcher - preferences window
// SPDX-License-Identifier: GPL-3.0-or-later

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Adw from 'gi://Adw';

import {buildShortcutPage} from './prefs/shortcutPage.js';
import {buildAppearancePage} from './prefs/appearancePage.js';
import {buildFeaturesPage} from './prefs/featuresPage.js';
import {buildWebSearchPage} from './prefs/webSearchPage.js';
import {buildAboutPage} from './prefs/aboutPage.js';

export default class GoshIsLauncherPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const shortcutPage = new Adw.PreferencesPage({
            title: 'Shortcut',
            icon_name: 'preferences-desktop-keyboard-symbolic',
        });
        shortcutPage.add(buildShortcutPage(settings));

        const appearancePage = new Adw.PreferencesPage({
            title: 'Appearance',
            icon_name: 'preferences-desktop-appearance-symbolic',
        });
        for (const group of buildAppearancePage(settings))
            appearancePage.add(group);

        const featuresPage = new Adw.PreferencesPage({
            title: 'Features',
            icon_name: 'preferences-system-symbolic',
        });
        for (const group of buildFeaturesPage(settings))
            featuresPage.add(group);

        const webPage = new Adw.PreferencesPage({
            title: 'Web Search',
            icon_name: 'web-browser-symbolic',
        });
        for (const group of buildWebSearchPage(settings))
            webPage.add(group);

        const aboutPage = new Adw.PreferencesPage({
            title: 'About',
            icon_name: 'dialog-information-symbolic',
        });
        for (const group of buildAboutPage())
            aboutPage.add(group);

        window.add(shortcutPage);
        window.add(appearancePage);
        window.add(featuresPage);
        window.add(webPage);
        window.add(aboutPage);
        window.set_search_enabled(true);
        window.set_default_size(680, 720);
    }
}
