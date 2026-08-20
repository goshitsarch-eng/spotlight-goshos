// gosh is launcher - ime preedit detection
// SPDX-License-Identifier: GPL-3.0-or-later

// clutter.text.get_preedit_string returns either a string or
// [text attrs cursor] depending on gjs out-parameter binding
export function readPreedit(result) {
    if (typeof result === 'string')
        return result;
    if (result && typeof result[0] === 'string')
        return result[0];
    return '';
}

// stage capture must not eat enter or arrows while an ime is composing
export function shouldPropagateForPreedit(preedit) {
    return shouldPropagateForIme(preedit, false);
}

// lookup tables can stay visible after preedit is empty
export function shouldPropagateForIme(preedit, candidateVisible) {
    if (typeof preedit === 'string' && preedit.length > 0)
        return true;
    return Boolean(candidateVisible);
}
