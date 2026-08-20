// gosh is launcher - section titles
// SPDX-License-Identifier: GPL-3.0-or-later

const SECTION_TITLES = {
    app: 'Applications',
    'app-action': 'Actions',
    calculator: 'Calculator',
    window: 'Windows',
    'system-action': 'System Actions',
    settings: 'Settings',
    file: 'Recent Files',
    path: 'Open Path',
    url: 'Open Link',
    command: 'Run Command',
    web: 'Web Search',
};

export function getSectionTitle(type) {
    return SECTION_TITLES[type] || 'Results';
}

export function getSectionTypes() {
    return Object.keys(SECTION_TITLES);
}
