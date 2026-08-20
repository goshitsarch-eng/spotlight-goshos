// gosh is launcher - hex color queries
// SPDX-License-Identifier: GPL-3.0-or-later

// require a leading hash so cafe and dead stay app searches
export function normalizeHexColor(query) {
    const text = query.trim();
    if (/^#[0-9a-f]{3}$/i.test(text)) {
        const s = text.slice(1).toLowerCase();
        return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
    }
    if (/^#[0-9a-f]{6}$/i.test(text))
        return text.toLowerCase();
    return null;
}
