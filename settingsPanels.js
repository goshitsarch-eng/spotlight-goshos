// gosh is launcher - gnome settings panel catalog
// SPDX-License-Identifier: GPL-3.0-or-later

export const SETTINGS_PANELS = [
    {id: 'wifi', title: 'Wi-Fi', keywords: ['wireless', 'wlan']},
    {id: 'network', title: 'Network', keywords: ['ethernet', 'vpn']},
    {id: 'wwan', title: 'Mobile Network', keywords: ['cellular', 'lte']},
    {id: 'bluetooth', title: 'Bluetooth', keywords: ['bt']},
    {id: 'display', title: 'Displays', keywords: ['monitor', 'resolution', 'night light']},
    {id: 'sound', title: 'Sound', keywords: ['audio', 'volume', 'speaker']},
    {id: 'power', title: 'Power', keywords: ['battery', 'sleep']},
    {id: 'multitasking', title: 'Multitasking', keywords: ['workspaces', 'overview']},
    {id: 'background', title: 'Appearance', keywords: ['theme', 'dark', 'style', 'wallpaper', 'background', 'appearance']},
    {id: 'notifications', title: 'Notifications', keywords: ['do not disturb']},
    {id: 'search', title: 'Search', keywords: []},
    {id: 'applications', title: 'Applications', keywords: ['apps', 'default apps']},
    {id: 'privacy', title: 'Privacy', keywords: ['permissions']},
    {id: 'online-accounts', title: 'Online Accounts', keywords: ['goa', 'google']},
    {id: 'sharing', title: 'Sharing', keywords: ['remote']},
    {id: 'wellbeing', title: 'Wellbeing', keywords: ['screentime', 'limit']},
    {id: 'keyboard', title: 'Keyboard', keywords: ['shortcut', 'input']},
    {id: 'mouse', title: 'Mouse & Touchpad', keywords: ['trackpad', 'pointer']},
    {id: 'wacom', title: 'Drawing Tablet', keywords: ['stylus', 'pen', 'wacom']},
    {id: 'color', title: 'Color', keywords: ['icc', 'calibration']},
    {id: 'printers', title: 'Printers', keywords: ['cups']},
    {id: 'universal-access', title: 'Accessibility', keywords: ['a11y', 'screen reader']},
    {id: 'users', title: 'Users', keywords: ['account', 'password', 'user-accounts']},
    {id: 'region', title: 'Region & Language', keywords: ['locale', 'timezone']},
    {id: 'datetime', title: 'Date & Time', keywords: ['clock']},
    {id: 'about', title: 'About', keywords: ['hardware', 'version', 'info-overview']},
    {id: 'system', title: 'System', keywords: ['software update']},
];

export function matchSettingsPanels(query, maxResults) {
    const lowerQuery = query.toLowerCase();
    const normalizedQuery = lowerQuery.replace(/[-_\s]/g, '');

    const matchingPanels = SETTINGS_PANELS.filter(p => {
        const normalizedTitle = p.title.toLowerCase().replace(/[-_\s]/g, '');
        if (normalizedTitle.includes(normalizedQuery) ||
            p.title.toLowerCase().includes(lowerQuery) ||
            p.id.replace(/[-_]/g, '').includes(normalizedQuery))
            return true;
        for (const keyword of p.keywords) {
            const normalizedKeyword = keyword.replace(/[-_\s]/g, '');
            if (keyword.includes(lowerQuery) || normalizedKeyword.includes(normalizedQuery))
                return true;
        }
        return false;
    });

    return matchingPanels.slice(0, maxResults);
}

// immutable images may ship settings without the gnome-control-center name
export function settingsArgv(panelId, findInPath) {
    // gnome 50 dropped the appearance id the style controls live on background
    const id = panelId === 'appearance' ? 'background' : panelId;
    if (findInPath('gnome-control-center'))
        return ['gnome-control-center', id];
    if (findInPath('gio'))
        return ['gio', 'launch', `gnome-${id}-panel.desktop`];
    if (findInPath('gapplication'))
        return ['gapplication', 'launch', 'org.gnome.Settings'];
    return null;
}
