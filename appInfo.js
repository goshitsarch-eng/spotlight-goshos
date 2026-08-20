// gosh is launcher - read desktop fields that only some app infos expose
// SPDX-License-Identifier: GPL-3.0-or-later

import {appMatchTier} from './appMatch.js';

// get_installed returns gappinfo gnome 50 still types some of those as
// the interface so desktop-only methods are missing not null
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/appDisplay.js
export function appId(app) {
    if (!app || typeof app.get_id !== 'function')
        return '';
    return app.get_id() || '';
}

export function appName(app) {
    if (app && typeof app.get_name === 'function') {
        const name = app.get_name();
        if (name)
            return name;
    }
    return appId(app);
}

export function appGenericName(app) {
    if (!app || typeof app.get_generic_name !== 'function')
        return '';
    return app.get_generic_name() || '';
}

export function appKeywords(app) {
    if (!app || typeof app.get_keywords !== 'function')
        return [];
    const keywords = app.get_keywords();
    return Array.isArray(keywords) ? keywords : [];
}

export function appDescription(app) {
    if (!app || typeof app.get_description !== 'function')
        return '';
    return app.get_description() || '';
}

export function appActionIds(app) {
    if (!app || typeof app.list_actions !== 'function')
        return [];
    const ids = app.list_actions();
    return Array.isArray(ids) ? ids : [];
}

export function appActionName(app, actionId) {
    if (!app || typeof app.get_action_name !== 'function')
        return actionId;
    return app.get_action_name(actionId) || actionId;
}

export function describeInstalledApp(app) {
    const id = appId(app);
    if (!id)
        return null;
    return {
        id,
        name: appName(app),
        generic: appGenericName(app),
        keywords: appKeywords(app),
        description: appDescription(app),
    };
}

export function collectInstalledAppMatches(apps, query, shouldShow) {
    const scored = [];
    const q = (query || '').toLowerCase();
    if (q.length === 0)
        return scored;

    for (const app of apps) {
        try {
            if (!shouldShow(app))
                continue;
            const info = describeInstalledApp(app);
            if (!info)
                continue;
            const tier = appMatchTier(
                info.name, info.generic, info.id, info.keywords, q, info.description,
            );
            if (tier < 0)
                continue;
            scored.push({
                app,
                appId: info.id,
                title: info.name,
                tier,
            });
        } catch (e) {
            // gnome 50 skips get_id when the desktop encoding is bad
        }
    }
    return scored;
}

export function collectUsableApps(apps, shouldShow) {
    const usable = [];
    for (const app of apps) {
        try {
            if (!shouldShow(app))
                continue;
            if (!appId(app))
                continue;
            usable.push(app);
        } catch (e) {
            // gnome 50 skips get_id when the desktop encoding is bad
        }
    }
    return usable;
}
