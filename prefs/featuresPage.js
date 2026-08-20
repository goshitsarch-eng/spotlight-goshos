// gosh is launcher - feature toggle preferences
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';

function addSwitch(group, settings, key, title, subtitle) {
    const row = new Adw.SwitchRow({title, subtitle});
    settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
    group.add(row);
    return row;
}

export function buildFeaturesPage(settings) {
    const providers = new Adw.PreferencesGroup({
        title: 'Search providers',
        description: 'Turn individual result types on or off',
    });

    addSwitch(providers, settings, 'enable-app-search',
        'Applications', 'Installed apps ranked by match quality and usage. open firefox, chrome browser, find firefox, search for firefox, and find windows firefox still find the app. open source stays a name');
    const actionsRow = addSwitch(providers, settings, 'enable-app-actions',
        'Application actions', 'New window and desktop-file actions for the best app match. Applications must stay enabled');
    const syncActionsRow = () => {
        actionsRow.sensitive = settings.get_boolean('enable-app-search');
    };
    settings.connect('changed::enable-app-search', syncActionsRow);
    syncActionsRow();
    addSwitch(providers, settings, 'enable-calculator',
        'Calculator', 'Evaluate math including 50%, sqrt, asin, log2, sin 90, 1+2=, 1+2=3, 1 000 + 2, 5!, e+1, =e, 2pi^2, 5 squared, 2 to the power of 8, 2 to the 8th, 2 to the eighth, 2 plus 2, two plus two, twenty plus two, two million, 2 add 3, 8 subtract 3, half of 80, square root of 16, and 8 over 2 and copy the result with Enter');
    addSwitch(providers, settings, 'enable-unit-convert',
        'Unit conversion', '10 km to mi, ten km to mi, 10 km into mi, convert 10 km to mi, how many miles in 10 km, how many miles in ten km, two million km to mi, 1 000 km to mi, 1 cup to tbsp, 1 fl oz to ml, 2 hours to min, 100 kph to mph, 32 psi to bar, 200 kcal to kj, 1 hp to kw, 180 deg to rad, 32 f to c');
    addSwitch(providers, settings, 'enable-color-hex',
        'Hex colors', 'Type #f00, red, rebeccapurple, rgb(255, 0, 0), rgb 255 0 0, rgb 100% 0% 0%, rgba 255 0 0 0.5, rgb(100%, 0%, 0%), hsl(0deg 100% 50%), hsl 0 100% 50%, hsl(0 100 50), or hwb(0 0% 0%) and press Enter to copy');
    addSwitch(providers, settings, 'enable-window-search',
        'Open windows', 'Switch by title, class, workspace 2, workspace two, workspace twenty, switch to firefox, or find windows firefox. Type close firefox, close the firefox window, close the firefox application, can you close firefox, kill firefox, force quit firefox, or force close firefox');
    addSwitch(providers, settings, 'enable-system-actions',
        'System actions', 'Lock, suspend, restart, power off, log out, switch user, lock or unlock rotation, screenshot. lock the screen, lock now, unlock, lock orientation, turn off, power off, sign out, and sign off match');
    addSwitch(providers, settings, 'enable-settings-search',
        'GNOME Settings', 'Jump to Settings panels including Privacy & Security. open wifi settings and open display preferences still find the panel');
    addSwitch(providers, settings, 'enable-recent-files',
        'Recent files', 'Open recently used local files and sftp/smb locations');
    addSwitch(providers, settings, 'enable-url-open',
        'Open URLs', 'Launch typed addresses, domains, sftp/smb locations, and mailto links');
    addSwitch(providers, settings, 'enable-path-open',
        'Open paths', 'Open ~/ ./ and absolute paths. Directories also offer Open in Terminal including Kitty, Foot, Ghostty, Alacritty, WezTerm, and Tilix');
    addSwitch(providers, settings, 'enable-places',
        'Folders', 'Home, Documents, Downloads, and the other XDG user folders. open my documents, navigate to downloads, open the pictures folder, and open pictures dir still find those folders');
    addSwitch(providers, settings, 'enable-bookmarks',
        'Bookmarks', 'Folders saved in the GTK 3 and GTK 4 bookmark files');
    addSwitch(providers, settings, 'enable-time-date',
        'Time and date', 'Type time, now, what time is it, what\'s the time right now, show me the time, tell me the time, tell me what time it is, date, today, today\'s date, what day is it, tomorrow, or yesterday to copy the local clock');
    addSwitch(providers, settings, 'enable-command-run',
        'Command runner', 'Run a PATH or file command with the ! prefix, including ~/.local/bin, Flatpak exports, ~/go/bin, and home-relative names such as scripts/deploy. This is not a shell so pipes and redirection stay literal arguments');

    const extras = new Adw.PreferencesGroup({
        title: 'Behavior',
    });
    addSwitch(extras, settings, 'enable-prefix-modes',
        'Prefix modes', '= calculator, @ web, # settings, $ windows, . files, ! command. Use a space after # . and $ so #ff0000, .bashrc, and $HOME stay normal searches');
    addSwitch(extras, settings, 'show-empty-suggestions',
        'Empty-state suggestions', 'Show windows and frequent apps before you type');

    return [providers, extras];
}
