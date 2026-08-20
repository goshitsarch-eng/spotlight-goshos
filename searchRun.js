// gosh is launcher - run a search plan against provider functions
// SPDX-License-Identifier: GPL-3.0-or-later

// a closed window or a bad xbel href can throw mid-list
// later providers must not lose the rows already collected
export function appendProviderResults(results, run, query, maxResults, settings, mode) {
    try {
        results.push(...run(query, maxResults, settings, mode));
    } catch (e) {
        // keep the rows from providers that already succeeded
    }
}

export function collectSearchResults(plan, maxResults, providers, settings) {
    const results = [];
    for (const name of plan.providers) {
        const run = providers[name];
        if (!run)
            continue;
        appendProviderResults(results, run, plan.query, maxResults, settings, plan.mode);
    }

    if (results.length === 0 && plan.webFallback && providers.web)
        appendProviderResults(results, providers.web, plan.query, maxResults, settings, plan.mode);

    return results;
}
