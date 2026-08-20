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
