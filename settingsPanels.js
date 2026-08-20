// gosh is launcher - gnome settings panel catalog
// SPDX-License-Identifier: GPL-3.0-or-later

export const SETTINGS_PANELS = [
    {id: 'wifi', title: 'Wi-Fi'},
    {id: 'network', title: 'Network'},
    {id: 'wwan', title: 'Mobile Network'},
    {id: 'bluetooth', title: 'Bluetooth'},
    {id: 'display', title: 'Displays'},
    {id: 'sound', title: 'Sound'},
    {id: 'power', title: 'Power'},
    {id: 'multitasking', title: 'Multitasking'},
    {id: 'appearance', title: 'Appearance'},
    {id: 'background', title: 'Background'},
    {id: 'notifications', title: 'Notifications'},
    {id: 'search', title: 'Search'},
    {id: 'applications', title: 'Applications'},
    {id: 'privacy', title: 'Privacy'},
    {id: 'online-accounts', title: 'Online Accounts'},
    {id: 'sharing', title: 'Sharing'},
    {id: 'wellbeing', title: 'Wellbeing'},
    {id: 'keyboard', title: 'Keyboard'},
    {id: 'mouse', title: 'Mouse & Touchpad'},
    {id: 'color', title: 'Color'},
    {id: 'printers', title: 'Printers'},
    {id: 'universal-access', title: 'Accessibility'},
    {id: 'users', title: 'Users'},
    {id: 'region', title: 'Region & Language'},
    {id: 'datetime', title: 'Date & Time'},
    {id: 'about', title: 'About'},
    {id: 'system', title: 'System'},
];

export function matchSettingsPanels(query, maxResults) {
    const lowerQuery = query.toLowerCase();
    const normalizedQuery = lowerQuery.replace(/[-_\s]/g, '');

    const matchingPanels = SETTINGS_PANELS.filter(p => {
        const normalizedTitle = p.title.toLowerCase().replace(/[-_\s]/g, '');
        return normalizedTitle.includes(normalizedQuery) ||
               p.title.toLowerCase().includes(lowerQuery) ||
               p.id.replace(/[-_]/g, '').includes(normalizedQuery);
    });

    return matchingPanels.slice(0, maxResults);
}
