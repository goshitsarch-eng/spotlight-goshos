// gosh is launcher - app search provider
// SPDX-License-Identifier: GPL-3.0-or-later
import Shell from 'gi://Shell';
import * as ParentalControlsManager from 'resource:///org/gnome/shell/misc/parentalControlsManager.js';
import {wordPrefixMatch} from './wordMatch.js';

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

    for (const app of allApps) {
        if (!_shouldShowApp(pcm, app))
            continue;

        const name = app.get_name() || '';
        const id = app.get_id() || '';
        const nameLower = name.toLowerCase();
        const idLower = id.replace('.desktop', '').toLowerCase();

        // tier determines match quality - lower is better
        // tier 0: name starts with query
        // tier 1: any word in name starts with query
        // tier 2: name contains query anywhere
        // tier 3: desktop id contains query
        // -1: no match
        let tier = -1;

        if (nameLower.startsWith(q)) {
            tier = 0;
        } else if (wordPrefixMatch(nameLower, q)) {
            tier = 1;
        } else if (nameLower.includes(q)) {
            tier = 2;
        } else if (idLower.includes(q)) {
            tier = 3;
        }

        if (tier < 0)
            continue;

        // strip a known trailing variant suffix (e.g. "Firefox ESR" -> "firefox")
        // rather than splitting on any hyphen, which would also wrongly
        // truncate apps whose real name contains one, like "GNOME-Builder"
        const baseName = nameLower
            .replace(/[\s-]+(esr|beta|nightly|dev|canary|stable|preview)$/, '')
            .trim();

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
                app.launch([], null);
        },
    }));
}

export function searchFrequentApps(maxResults) {
    const appSystem = Shell.AppSystem.get_default();
    const allApps = appSystem.get_installed();
    const appUsage = Shell.AppUsage.get_default();
    const pcm = _parentalControls();
    const usable = [];

    for (const app of allApps) {
        if (!_shouldShowApp(pcm, app))
            continue;
        const id = app.get_id();
        if (!id)
            continue;
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
                app.launch([], null);
        },
    }));
}

