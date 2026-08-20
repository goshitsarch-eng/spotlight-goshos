// gosh is launcher - build a mutter accelerator string
// SPDX-License-Identifier: GPL-3.0-or-later

const MODIFIER_KEY_NAMES = {
    Control_L: true,
    Control_R: true,
    Shift_L: true,
    Shift_R: true,
    Alt_L: true,
    Alt_R: true,
    Super_L: true,
    Super_R: true,
    Meta_L: true,
    Meta_R: true,
    Hyper_L: true,
    Hyper_R: true,
    Caps_Lock: true,
    ISO_Level3_Shift: true,
    ISO_Level5_Shift: true,
};

export function isModifierKeyName(keyName) {
    return Boolean(MODIFIER_KEY_NAMES[keyName]);
}

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

export function shortcutDisplayLabel(shortcutArray) {
    return formatShortcutList(shortcutArray) || 'Not set (will default to Ctrl+Space)';
}

// a failed grab writes the working accel back capture must not freeze the old key
export function shortcutLabelAfterChange(shortcutArray, capturing) {
    if (capturing)
        return null;
    return shortcutDisplayLabel(shortcutArray);
}

export function shortcutAttempts(requested, fallback = '<Control>space') {
    const extras = [fallback, '<Super>space', '<Alt>space'];
    const out = [];
    const seen = {};
    for (const accel of [requested].concat(extras)) {
        if (!accel || seen[accel])
            continue;
        seen[accel] = true;
        out.push(accel);
    }
    if (out.length === 0)
        return [fallback];
    return out;
}

// a working grab must not be replaced by a fallback the user did not pick
export function shortcutRetryList(requested, currentGrab) {
    if (currentGrab)
        return [];
    return shortcutAttempts(requested).filter(accel => accel !== requested);
}

export function shortcutToPersist(requested, working) {
    if (!working || working === requested)
        return null;
    return working;
}

// hold-repeat would cancel a pending open or flip reopen-after-close
export function acceleratorGrabFlags(flags) {
    if (!flags)
        return 0;
    const ignore = flags.IGNORE_AUTOREPEAT;
    if (typeof ignore === 'number' && ignore > 0)
        return ignore;
    return 0;
}
