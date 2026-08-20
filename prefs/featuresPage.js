// gosh is launcher - feature toggle preferences
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';

function addSwitch(group, settings, key, title, subtitle) {
    const row = new Adw.SwitchRow({title, subtitle});
    settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
    group.add(row);
}

export function buildFeaturesPage(settings) {
    const providers = new Adw.PreferencesGroup({
        title: 'Search providers',
        description: 'Turn individual result types on or off',
    });

    addSwitch(providers, settings, 'enable-app-search',
        'Applications', 'Installed apps ranked by match quality and usage');
    addSwitch(providers, settings, 'enable-app-actions',
        'Application actions', 'New window and desktop-file actions for the best app match');
    addSwitch(providers, settings, 'enable-calculator',
        'Calculator', 'Evaluate math and copy the result with Enter');
    addSwitch(providers, settings, 'enable-unit-convert',
        'Unit conversion', '10 km to mi, 32 f to c, 1 gb to mib');
    addSwitch(providers, settings, 'enable-window-search',
        'Open windows', 'Switch by title, class, or workspace');
    addSwitch(providers, settings, 'enable-system-actions',
        'System actions', 'Lock, suspend, restart, shut down, log out, switch user, screenshot');
    addSwitch(providers, settings, 'enable-settings-search',
        'GNOME Settings', 'Jump to Settings panels including Privacy & Security');
    addSwitch(providers, settings, 'enable-recent-files',
        'Recent files', 'Open recently used files');
    addSwitch(providers, settings, 'enable-url-open',
        'Open URLs', 'Launch typed addresses and domain names');
    addSwitch(providers, settings, 'enable-path-open',
        'Open paths', 'Open ~/ ./ and absolute paths in the default handler');
    addSwitch(providers, settings, 'enable-command-run',
        'Command runner', 'Run a command with the ! prefix');

    const extras = new Adw.PreferencesGroup({
        title: 'Behavior',
    });
    addSwitch(extras, settings, 'enable-prefix-modes',
        'Prefix modes', '= calculator, @ web, # settings, $ windows, . files, ! command. Use a space after . and $ so .bashrc and $HOME stay normal searches');
    addSwitch(extras, settings, 'show-empty-suggestions',
        'Empty-state suggestions', 'Show windows and frequent apps before you type');

    return [providers, extras];
}
