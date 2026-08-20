// gosh is launcher - app search provider
// SPDX-License-Identifier: GPL-3.0-or-later
import Shell from 'gi://Shell';
import * as ParentalControlsManager from 'resource:///org/gnome/shell/misc/parentalControlsManager.js';
import {appMatchTier, appBaseName} from './appMatch.js';

function _parentalControls() {
    return ParentalControlsManager.getDefault();
}

function _shouldShowApp(pcm, app) {
    if (!app.should_show())
        return false;
    if (!pcm.initialized)
        return true;
    return pcm.shouldShowApp(app);
}

// searches installed apps using shell appsystem
// uses gnome-style matching: prefix first then word-prefix then substring
// this is how gnome default search works so chro finds chrome not claude
// dedupes by base name so firefox and firefox esr don't both show
// sorts by match tier then by usage frequency
export function searchApps(query, maxResults) {
    const appSystem = Shell.AppSystem.get_default();
    const allApps = appSystem.get_installed();
    const pcm = _parentalControls();
    const seenNames = new Set();
    const scored = [];
    const q = query.toLowerCase();
    if (q.length === 0)
        return [];

    for (const app of allApps) {
        if (!_shouldShowApp(pcm, app))
            continue;

        const id = app.get_id() || '';
        const name = app.get_name() || id;
        const generic = app.get_generic_name() || '';
        const keywords = app.get_keywords() || [];
        const tier = appMatchTier(name, generic, id, keywords, q);
        if (tier < 0)
            continue;

        const baseName = appBaseName(name);

        if (seenNames.has(baseName))
            continue;
        seenNames.add(baseName);

        scored.push({app, appId: id, title: name, tier});
    }

    // appusage.compare is called once per sort pair so fetch the singleton
    // outside the comparator instead of on every comparison
    const appUsage = Shell.AppUsage.get_default();
    scored.sort((a, b) => {
        if (a.tier !== b.tier)
            return a.tier - b.tier;
        return appUsage.compare(a.appId, b.appId);
    });

    return scored.slice(0, maxResults).map(({app, title}) => ({
        type: 'app',
        title,
        app,
        icon: app.get_icon(),
        activate: () => {
            const shellApp = appSystem.lookup_app(app.get_id());
            if (shellApp)
                shellApp.activate();
            else
                app.launch([], global.create_app_launch_context(0, -1));
        },
    }));
}

export function searchFrequentApps(maxResults) {
    const appSystem = Shell.AppSystem.get_default();
    const allApps = appSystem.get_installed();
    const appUsage = Shell.AppUsage.get_default();
    const pcm = _parentalControls();
    const usable = [];
    const seenNames = new Set();

    for (const app of allApps) {
        if (!_shouldShowApp(pcm, app))
            continue;
        const id = app.get_id();
        if (!id)
            continue;
        const baseName = appBaseName(app.get_name() || id);
        if (seenNames.has(baseName))
            continue;
        seenNames.add(baseName);
        usable.push(app);
    }

    usable.sort((a, b) => appUsage.compare(a.get_id(), b.get_id()));

    return usable.slice(0, maxResults).map(app => ({
        type: 'app',
        title: app.get_name() || app.get_id(),
        app,
        icon: app.get_icon(),
        activate: () => {
            const shellApp = appSystem.lookup_app(app.get_id());
            if (shellApp)
                shellApp.activate();
            else
                app.launch([], global.create_app_launch_context(0, -1));
        },
    }));
}

