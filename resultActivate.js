// gosh is launcher - activate a result without taking down the shell
// SPDX-License-Identifier: GPL-3.0-or-later

export function activateResultSafe(result) {
    try {
        result.activate();
        return true;
    } catch (e) {
        // mutter and systemactions throw if the target vanished after the list
        return false;
    }
}
