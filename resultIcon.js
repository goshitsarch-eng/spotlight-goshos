// gosh is launcher - pick a result icon without passing a null gicon
// SPDX-License-Identifier: GPL-3.0-or-later

// st.icon throws or draws nothing when gicon is null
// a missing or throwing app icon must still fall back so the row can paint
export function appIconOrFallback(app, fallbackName) {
    if (app && typeof app.get_icon === 'function') {
        try {
            const gicon = app.get_icon();
            if (gicon)
                return {gicon};
        } catch (e) {
            // mutter can drop the icon after the match
        }
    }
    return {icon_name: fallbackName};
}

export function windowIconOrFallback(gicon) {
    if (gicon)
        return gicon;
    return 'focus-windows-symbolic';
}

// a hidden icon can still take box spacing on some st builds
export function shouldBuildResultIcon(showIcons) {
    return Boolean(showIcons);
}

export function resultIconSource(result) {
    if (result.app)
        return appIconOrFallback(result.app, 'application-x-executable');
    if (typeof result.icon === 'string' && result.icon)
        return {icon_name: result.icon};
    if (result.icon)
        return {gicon: result.icon};
    return {icon_name: 'application-x-executable-symbolic'};
}
