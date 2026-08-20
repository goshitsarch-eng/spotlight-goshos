// gosh is launcher - desktop action labels for a matched app
// SPDX-License-Identifier: GPL-3.0-or-later

// skip the desktop new-window action when the shell already offers one
export function isNewWindowAction(actionId) {
    const id = actionId.toLowerCase().replace(/_/g, '-');
    return id === 'new-window' || id === 'newwindow';
}

export function newWindowTitle(appName) {
    return `New window — ${appName}`;
}

export function desktopActionTitle(actionName, appName) {
    return `${actionName} — ${appName}`;
}

export function takeAppActions(actions, maxResults) {
    if (maxResults <= 0)
        return [];
    return actions.slice(0, maxResults);
}
