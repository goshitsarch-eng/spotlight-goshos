// gosh is launcher - app search provider
// SPDX-License-Identifier: GPL-3.0-or-later
import Shell from 'gi://Shell';
import * as ParentalControlsManager from 'resource:///org/gnome/shell/misc/parentalControlsManager.js';
import {appMatchTier, takeUniqueByBaseName, appRowDescription} from './appMatch.js';
import {isNewWindowAction, newWindowTitle, desktopActionTitle, takeAppActions, actionResultLimit} from './appAction.js';
import {shouldOfferApp, hasParentalGiveUp} from './appReady.js';

function _parentalControls() {
    return ParentalControlsManager.getDefault();
}

function _shouldShowApp(pcm, app) {
    if (pcm.initialized)
        return pcm.shouldShowApp(app);
    return shouldOfferApp(app.should_show(), false, false, hasParentalGiveUp());
}

function _appActionRows(app, shellApp, maxResults) {
    const name = app.get_name() || app.get_id();
    const rows = [];
    if (shellApp && shellApp.get_n_windows() > 0 && shellApp.can_open_new_window()) {
        rows.push({
            type: 'app-action',
            title: newWindowTitle(name),
            description: 'Application action',
            icon: app.get_icon(),
            activate: () => shellApp.open_new_window(-1),
        });
    }
    for (const actionId of app.list_actions()) {
        if (isNewWindowAction(actionId))
            continue;
        const label = app.get_action_name(actionId) || actionId;
        rows.push({
            type: 'app-action',
            title: desktopActionTitle(label, name),
            description: 'Application action',
            icon: app.get_icon(),
            activate: () => {
                try {
                    app.launch_action(actionId, global.create_app_launch_context(0, -1));
                } catch (e) {
                    // gerror if the desktop action vanished after the list
                }
            },
        });
    }
    return takeAppActions(rows, maxResults);
}

// searches installed apps using shell appsystem
// uses gnome-style matching: prefix first then word-prefix then substring
// this is how gnome default search works so chro finds chrome not claude
// dedupes by base name so firefox and firefox esr don't both show
// sorts by match tier then by usage frequency
export function searchApps(query, maxResults, offerActions) {
    const appSystem = Shell.AppSystem.get_default();
    const allApps = appSystem.get_installed();
    const pcm = _parentalControls();
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
        const description = app.get_description() || '';
        const tier = appMatchTier(name, generic, id, keywords, q, description);
        if (tier < 0)
            continue;

        const shellApp = appSystem.lookup_app(id);
        scored.push({
            app,
            appId: id,
            title: name,
            tier,
            shellApp,
            windowCount: shellApp ? shellApp.get_n_windows() : 0,
        });
    }

    // appusage.compare is called once per sort pair so fetch the singleton
    // outside the comparator instead of on every comparison
    const appUsage = Shell.AppUsage.get_default();
    scored.sort((a, b) => {
        if (a.tier !== b.tier)
            return a.tier - b.tier;
        return appUsage.compare(a.appId, b.appId);
    });

    const unique = takeUniqueByBaseName(scored, item => item.title, maxResults);
    const results = unique.map(item => ({
        type: 'app',
        title: item.title,
        app: item.app,
        description: appRowDescription(item.windowCount),
        icon: item.app.get_icon(),
        activate: () => {
            if (item.shellApp)
                item.shellApp.activate();
            else
                item.app.launch([], global.create_app_launch_context(0, -1));
        },
    }));
    if (offerActions && unique.length > 0) {
        results.push(..._appActionRows(
            unique[0].app,
            unique[0].shellApp,
            actionResultLimit(maxResults, unique.length),
        ));
    }
    return results;
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

    return takeUniqueByBaseName(usable, app => app.get_name() || app.get_id(), maxResults).map(app => {
        const shellApp = appSystem.lookup_app(app.get_id());
        return {
            type: 'app',
            title: app.get_name() || app.get_id(),
            app,
            description: appRowDescription(shellApp ? shellApp.get_n_windows() : 0),
            icon: app.get_icon(),
            activate: () => {
                if (shellApp)
                    shellApp.activate();
                else
                    app.launch([], global.create_app_launch_context(0, -1));
            },
        };
    });
}

