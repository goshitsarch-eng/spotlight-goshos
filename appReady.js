// gosh is launcher - whether an installed app may appear in results
// SPDX-License-Identifier: GPL-3.0-or-later

export function shouldOfferApp(desktopShouldShow, parentalInitialized, parentalAllows) {
    if (!desktopShouldShow)
        return false;
    // gnome 50 hides apps until malcontent finishes so blocked apps do not flash
    if (!parentalInitialized)
        return false;
    return parentalAllows;
}
