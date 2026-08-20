// gosh is launcher - activate a result without taking down the shell
// SPDX-License-Identifier: GPL-3.0-or-later

// pending and missing path or command rows must not close the popup
export function resultCanActivate(result) {
    if (!result || typeof result.activate !== 'function')
        return false;
    return result.activatable !== false;
}

// enter on a checking row should run a sibling that is ready
export function activatableResult(results, selectedIndex) {
    if (selectedIndex >= 0 && selectedIndex < results.length &&
        resultCanActivate(results[selectedIndex]))
        return results[selectedIndex];
    for (const result of results) {
        if (resultCanActivate(result))
            return result;
    }
    return null;
}

export function activateResultSafe(result) {
    try {
        result.activate();
        return true;
    } catch (e) {
        // mutter and systemactions throw if the target vanished after the list
        return false;
    }
}
