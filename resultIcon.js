// gosh is launcher - pick a result icon without passing a null gicon
// SPDX-License-Identifier: GPL-3.0-or-later

// st.icon throws or draws nothing when gicon is null
// a missing app icon must still fall back so paint can finish
export function resultIconSource(result) {
    if (result.app && typeof result.app.get_icon === 'function') {
        const gicon = result.app.get_icon();
        if (gicon)
            return {gicon};
        return {icon_name: 'application-x-executable'};
    }
    if (typeof result.icon === 'string' && result.icon)
        return {icon_name: result.icon};
    if (result.icon)
        return {gicon: result.icon};
    return {icon_name: 'application-x-executable-symbolic'};
}
