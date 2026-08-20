// gosh is launcher - build a mutter accelerator string
// SPDX-License-Identifier: GPL-3.0-or-later

export function normalizeAccelKey(keyName) {
    if (!keyName)
        return '';
    if (keyName.length === 1)
        return keyName.toLowerCase();
    return keyName;
}

export function modifiersFromMask(state, masks) {
    return {
        super: Boolean(state & masks.super),
        control: Boolean(state & masks.control),
        shift: Boolean(state & masks.shift),
        alt: Boolean(state & masks.alt),
        meta: Boolean(state & masks.meta),
    };
}

export function buildAccelerator(keyName, mods) {
    const key = normalizeAccelKey(keyName);
    if (!key)
        return '';

    let accelerator = '';
    if (mods.super)
        accelerator += '<Super>';
    if (mods.control)
        accelerator += '<Control>';
    if (mods.shift)
        accelerator += '<Shift>';
    if (mods.alt)
        accelerator += '<Alt>';
    // super also sets meta on most keyboards so do not write both
    if (mods.meta && !mods.super)
        accelerator += '<Meta>';
    accelerator += key;
    return accelerator;
}

export function formatAccelerator(accelerator) {
    if (!accelerator)
        return '';
    return accelerator
        .replace(/<Super>/g, 'Super+')
        .replace(/<Control>/g, 'Ctrl+')
        .replace(/<Shift>/g, 'Shift+')
        .replace(/<Alt>/g, 'Alt+')
        .replace(/<Meta>/g, 'Meta+');
}

export function formatShortcutList(shortcutArray) {
    if (!shortcutArray || shortcutArray.length === 0)
        return '';
    return formatAccelerator(shortcutArray[0]);
}
