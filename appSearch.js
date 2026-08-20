// gosh is launcher - app search provider
// SPDX-License-Identifier: GPL-3.0-or-later
import Shell from 'gi://Shell';
import * as ParentalControlsManager from 'resource:///org/gnome/shell/misc/parentalControlsManager.js';
import {takeUniqueByBaseName, appRowDescription} from './appMatch.js';
import {isNewWindowAction, newWindowTitle, desktopActionTitle, takeAppActions, actionResultLimit} from './appAction.js';
import {shouldOfferApp, hasParentalGiveUp} from './appReady.js';
import {appId, appName, appActionIds, appActionName, collectInstalledAppMatches, collectUsableApps} from './appInfo.js';

function _parentalControls() {
    return ParentalControlsManager.getDefault();
}

function _shouldShowApp(pcm, app) {
    if (pcm.initialized)
        return pcm.shouldShowApp(app);
    return shouldOfferApp(app.should_show(), false, false, hasParentalGiveUp());
}

function _appActionRows(app, shellApp, maxResults) {
    try {
        const name = appName(app);
        const rows = [];
        if (shellApp && shellApp.get_n_windows() > 0 && shellApp.can_open_new_window()) {
            rows.push({
                type: 'app-action',
                title: newWindowTitle(name),
                description: 'Application action',
                id: `new-window:${appId(app) || name}`,
                app,
                icon: 'application-x-executable-symbolic',
                activate: () => shellApp.open_new_window(-1),
            });
        }
        for (const actionId of appActionIds(app)) {
            if (isNewWindowAction(actionId))
                continue;
            const label = appActionName(app, actionId);
            rows.push({
                type: 'app-action',
                title: desktopActionTitle(label, name),
                description: 'Application action',
                id: `action:${appId(app) || name}:${actionId}`,
                app,
                icon: 'application-x-executable-symbolic',
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
    } catch (e) {
        // a bad action list must not drop the app rows already scored
        return [];
    }
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
    const scored = collectInstalledAppMatches(
        allApps,
        query,
        app => _shouldShowApp(pcm, app),
    );

    // appusage.compare is called once per sort pair so fetch the singleton
    // outside the comparator instead of on every comparison
    const appUsage = Shell.AppUsage.get_default();
    scored.sort((a, b) => {
        if (a.tier !== b.tier)
            return a.tier - b.tier;
        return appUsage.compare(a.appId, b.appId);
    });

    const unique = takeUniqueByBaseName(scored, item => item.title, maxResults);
    const results = unique.map(item => {
        const shellApp = appSystem.lookup_app(item.appId);
        return {
            type: 'app',
            title: item.title,
            app: item.app,
            id: item.appId,
            description: appRowDescription(shellApp ? shellApp.get_n_windows() : 0),
            activate: () => {
                if (shellApp)
                    shellApp.activate();
                else
                    item.app.launch([], global.create_app_launch_context(0, -1));
            },
        };
    });
    if (offerActions && unique.length > 0) {
        results.push(..._appActionRows(
            unique[0].app,
            appSystem.lookup_app(unique[0].appId),
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
    const usable = collectUsableApps(allApps, app => _shouldShowApp(pcm, app));

    usable.sort((a, b) => appUsage.compare(appId(a), appId(b)));

    return takeUniqueByBaseName(usable, app => appName(app), maxResults).map(app => {
        const id = appId(app);
        const shellApp = appSystem.lookup_app(id);
        return {
            type: 'app',
            title: appName(app),
            app,
            id,
            description: appRowDescription(shellApp ? shellApp.get_n_windows() : 0),
            activate: () => {
                if (shellApp)
                    shellApp.activate();
                else
                    app.launch([], global.create_app_launch_context(0, -1));
            },
        };
    });
}
