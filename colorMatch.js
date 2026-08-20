// gosh is launcher - hex and rgb color queries
// SPDX-License-Identifier: GPL-3.0-or-later

function hexByte(n) {
    return n.toString(16).padStart(2, '0');
}

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

export function normalizeRgbColor(query) {
    const match = query.trim().match(
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i
    );
    if (!match)
        return null;
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    if (r > 255 || g > 255 || b > 255)
        return null;
    return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}

export function normalizeColor(query) {
    return normalizeHexColor(query) || normalizeRgbColor(query);
}
