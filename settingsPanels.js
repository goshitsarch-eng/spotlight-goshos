// gosh is launcher - gnome settings panel catalog
// SPDX-License-Identifier: GPL-3.0-or-later

import {wordPrefixMatch, keywordMatchesQuery} from './wordMatch.js';

export const SETTINGS_PANELS = [
    {id: 'wifi', title: 'Wi-Fi', icon: 'network-wireless-symbolic', keywords: ['wireless', 'wlan', 'hotspot', 'airplane']},
    {id: 'network', title: 'Network', icon: 'network-wired-symbolic', keywords: ['ethernet', 'vpn']},
    {id: 'wwan', title: 'Mobile Network', icon: 'network-cellular-symbolic', keywords: ['cellular', 'lte']},
    {id: 'bluetooth', title: 'Bluetooth', icon: 'bluetooth-symbolic', keywords: ['bt']},
    {id: 'display', title: 'Displays', icon: 'video-display-symbolic', keywords: ['monitor', 'resolution', 'night light', 'scale', 'fractional scaling']},
    {id: 'sound', title: 'Sound', icon: 'audio-speakers-symbolic', keywords: ['audio', 'volume', 'speaker']},
    {id: 'power', title: 'Power', icon: 'battery-symbolic', keywords: ['battery', 'sleep', 'battery saver', 'lid']},
    {id: 'multitasking', title: 'Multitasking', icon: 'view-app-grid-symbolic', keywords: ['workspaces', 'overview']},
    {id: 'background', title: 'Appearance', icon: 'preferences-desktop-wallpaper-symbolic', keywords: ['theme', 'dark', 'style', 'wallpaper', 'background', 'appearance']},
    {id: 'notifications', title: 'Notifications', icon: 'preferences-system-notifications-symbolic', keywords: ['do not disturb', 'dnd']},
    {id: 'search', title: 'Search', icon: 'system-search-symbolic', keywords: []},
    {id: 'applications', title: 'Applications', icon: 'view-grid-symbolic', keywords: ['apps', 'default apps', 'defaults']},
    // camera location and firmware are privacy subpages not launchable panel ids
    {id: 'privacy', title: 'Privacy & Security', icon: 'preferences-system-privacy-symbolic', keywords: ['permissions', 'camera', 'webcam', 'microphone', 'location', 'gps', 'thunderbolt', 'bolt', 'diagnostics', 'crash', 'firmware', 'lock', 'screen lock', 'device security']},
    {id: 'online-accounts', title: 'Online Accounts', icon: 'emblem-web-symbolic', keywords: ['goa', 'google']},
    {id: 'sharing', title: 'Sharing', icon: 'folder-publicshare-symbolic', keywords: ['remote']},
    {id: 'wellbeing', title: 'Wellbeing', icon: 'face-smile-symbolic', keywords: ['screentime', 'screen time', 'limit', 'break']},
    {id: 'keyboard', title: 'Keyboard', icon: 'input-keyboard-symbolic', keywords: ['shortcut', 'input']},
    {id: 'mouse', title: 'Mouse & Touchpad', icon: 'input-mouse-symbolic', keywords: ['trackpad', 'pointer']},
    {id: 'wacom', title: 'Drawing Tablet', icon: 'input-tablet-symbolic', keywords: ['stylus', 'pen', 'wacom']},
    {id: 'color', title: 'Color', icon: 'color-select-symbolic', keywords: ['icc', 'calibration']},
    {id: 'printers', title: 'Printers', icon: 'printer-symbolic', keywords: ['cups']},
    {id: 'universal-access', title: 'Accessibility', icon: 'preferences-desktop-accessibility-symbolic', keywords: ['a11y', 'screen reader', 'zoom', 'magnifier', 'large text', 'contrast', 'hearing']},
    {id: 'users', title: 'Users', icon: 'system-users-symbolic', keywords: ['account', 'password', 'user-accounts']},
    {id: 'region', title: 'Region & Language', icon: 'preferences-desktop-locale-symbolic', keywords: ['locale', 'timezone']},
    {id: 'datetime', title: 'Date & Time', icon: 'preferences-system-time-symbolic', keywords: ['clock']},
    {id: 'about', title: 'About', icon: 'dialog-information-symbolic', keywords: ['hardware', 'version', 'info-overview', 'winver']},
    {id: 'system', title: 'System', icon: 'preferences-system-symbolic', keywords: ['software update', 'software updates', 'remote desktop', 'ssh', 'secure shell', 'firmware', 'device security', 'secure boot']},
];

export function settingsPanelDesktop(panelId) {
    const id = panelId === 'appearance' ? 'background' : panelId;
    return `gnome-${id}-panel.desktop`;
}

// wellbeing shipped in gnome 48 hide the row when the panel desktop is gone
export function settingsPanelAvailable(panelId, hasDesktop) {
    if (panelId !== 'wellbeing')
        return true;
    return Boolean(hasDesktop(settingsPanelDesktop(panelId)));
}

export function matchSettingsPanels(query, maxResults, isAvailable) {
    const catalog = SETTINGS_PANELS.filter(p => !isAvailable || isAvailable(p.id));
    const lowerQuery = query.toLowerCase();
    const normalizedQuery = lowerQuery.replace(/[-_\s]/g, '');
    if (normalizedQuery.length === 0)
        return catalog.slice(0, maxResults);

    const matchingPanels = catalog.filter(p => {
        const titleLower = p.title.toLowerCase();
        const normalizedTitle = titleLower.replace(/[-_\s]/g, '');
        const normalizedId = p.id.replace(/[-_]/g, '');
        if (normalizedTitle.startsWith(normalizedQuery) || normalizedId.startsWith(normalizedQuery))
            return true;
        if (titleLower.startsWith(lowerQuery) || wordPrefixMatch(titleLower, lowerQuery))
            return true;
        for (const keyword of p.keywords) {
            if (keywordMatchesQuery(keyword, lowerQuery))
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
        return ['gapplication', 'launch', 'org.gnome.Settings', id];
    return null;
}

export function settingsResultMeta(panel, argv) {
    return {
        type: 'settings',
        title: panel.title,
        description: 'GNOME Settings',
        icon: panel.icon || 'preferences-system-symbolic',
        id: panel.id,
        activatable: argv !== null,
    };
}
