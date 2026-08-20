// gosh is launcher - whether an installed app may appear in results
// SPDX-License-Identifier: GPL-3.0-or-later

export const PARENTAL_GIVE_UP_MS = 5000;

let _parentalGaveUp = false;

export function hasParentalGiveUp() {
    return _parentalGaveUp;
}

export function markParentalGiveUp() {
    _parentalGaveUp = true;
}

export function resetParentalGiveUp() {
    _parentalGaveUp = false;
}

export function shouldOfferApp(desktopShouldShow, parentalInitialized, parentalAllows, parentalGaveUp) {
    if (!desktopShouldShow)
        return false;
    if (parentalInitialized)
        return parentalAllows;
    // malcontent dbus can fail without ever setting initialized
    return parentalGaveUp === true;
}
