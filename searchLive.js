// gosh is launcher - when to watch windows and apps for a live repaint
// SPDX-License-Identifier: GPL-3.0-or-later

// start only while the popup is open so enable() does not listen
export function nextLiveSearchAction(wasListening, wantListening) {
    if (wantListening && !wasListening)
        return 'start';
    if (!wantListening && wasListening)
        return 'stop';
    return 'keep';
}

export function shouldTrackLiveWindow(win, tracked) {
    if (!win)
        return false;
    return !tracked.includes(win);
}

// mutter can drop a window between list and connect
export function windowsForLiveTrack(listFn) {
    try {
        const windows = listFn();
        if (!Array.isArray(windows))
            return [];
        return windows.filter(win => win);
    } catch (e) {
        return [];
    }
}
