// gosh is launcher - run a search plan against provider functions
// SPDX-License-Identifier: GPL-3.0-or-later

export function collectSearchResults(plan, maxResults, providers, settings) {
    const results = [];
    for (const name of plan.providers) {
        const run = providers[name];
        if (!run)
            continue;
        results.push(...run(plan.query, maxResults, settings, plan.mode));
    }

    if (results.length === 0 && plan.webFallback && providers.web)
        results.push(...providers.web(plan.query, maxResults, settings));

    return results;
}
