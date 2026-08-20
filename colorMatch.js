// gosh is launcher - hex rgb hsl and hwb color queries
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
    if (/^#[0-9a-f]{4}$/i.test(text)) {
        const s = text.slice(1, 4).toLowerCase();
        return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
    }
    if (/^#[0-9a-f]{6}$/i.test(text))
        return text.toLowerCase();
    if (/^#[0-9a-f]{8}$/i.test(text))
        return `#${text.slice(1, 7).toLowerCase()}`;
    return null;
}

export function normalizeRgbColor(query) {
    const text = query.trim();
    const percent = text.match(
        /^rgba?\(\s*([\d.]+)\s*%\s*,\s*([\d.]+)\s*%\s*,\s*([\d.]+)\s*%\s*(?:,\s*[\d.]+\s*)?\)$/i
    ) || text.match(
        /^rgba?\(\s*([\d.]+)\s*%\s+([\d.]+)\s*%\s+([\d.]+)\s*%(?:\s*\/\s*[\d.%]+)?\s*\)$/i
    );
    if (percent) {
        const r = Number(percent[1]);
        const g = Number(percent[2]);
        const b = Number(percent[3]);
        if (r > 100 || g > 100 || b > 100)
            return null;
        return `#${hexByte(Math.round(r * 255 / 100))}${hexByte(Math.round(g * 255 / 100))}${hexByte(Math.round(b * 255 / 100))}`;
    }
    const match = text.match(
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i
    ) || text.match(
        /^rgba?\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s*\/\s*[\d.%]+)?\s*\)$/i
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

function hueToRgb(p, q, t) {
    let h = t;
    if (h < 0)
        h += 1;
    if (h > 1)
        h -= 1;
    if (h < 1 / 6)
        return p + (q - p) * 6 * h;
    if (h < 1 / 2)
        return q;
    if (h < 2 / 3)
        return p + (q - p) * (2 / 3 - h) * 6;
    return p;
}

function hslComponents(h, s, l) {
    const sat = s / 100;
    const light = l / 100;
    const hue = ((h % 360) + 360) % 360 / 360;
    if (sat === 0)
        return [light, light, light];
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    return [
        hueToRgb(p, q, hue + 1 / 3),
        hueToRgb(p, q, hue),
        hueToRgb(p, q, hue - 1 / 3),
    ];
}

function rgbBytesToHex(r, g, b) {
    return `#${hexByte(Math.round(r * 255))}${hexByte(Math.round(g * 255))}${hexByte(Math.round(b * 255))}`;
}

function hslToHex(h, s, l) {
    const [r, g, b] = hslComponents(h, s, l);
    return rgbBytesToHex(r, g, b);
}

function hwbToHex(h, w, bl) {
    const white = w / 100;
    const black = bl / 100;
    if (white + black >= 1) {
        const gray = white / (white + black);
        return rgbBytesToHex(gray, gray, gray);
    }
    const [hr, hg, hb] = hslComponents(h, 100, 50);
    const factor = 1 - white - black;
    return rgbBytesToHex(hr * factor + white, hg * factor + white, hb * factor + white);
}

export function normalizeHslColor(query) {
    const text = query.trim();
    const match = text.match(
        /^hsla?\(\s*(-?[\d.]+)(?:deg)?\s*,\s*([\d.]+)\s*%\s*,\s*([\d.]+)\s*%\s*(?:,\s*[\d.]+\s*)?\)$/i
    ) || text.match(
        /^hsla?\(\s*(-?[\d.]+)(?:deg)?\s+([\d.]+)\s*%\s+([\d.]+)\s*%(?:\s*\/\s*[\d.%]+)?\s*\)$/i
    );
    if (!match)
        return null;
    const s = Number(match[2]);
    const l = Number(match[3]);
    if (s > 100 || l > 100)
        return null;
    return hslToHex(Number(match[1]), s, l);
}

export function normalizeHwbColor(query) {
    const text = query.trim();
    const match = text.match(
        /^hwba?\(\s*(-?[\d.]+)(?:deg)?\s*,\s*([\d.]+)\s*%\s*,\s*([\d.]+)\s*%\s*(?:,\s*[\d.]+\s*)?\)$/i
    ) || text.match(
        /^hwba?\(\s*(-?[\d.]+)(?:deg)?\s+([\d.]+)\s*%\s+([\d.]+)\s*%(?:\s*\/\s*[\d.%]+)?\s*\)$/i
    );
    if (!match)
        return null;
    const w = Number(match[2]);
    const b = Number(match[3]);
    if (w > 100 || b > 100)
        return null;
    return hwbToHex(Number(match[1]), w, b);
}

export function normalizeColor(query) {
    return normalizeHexColor(query) ||
        normalizeRgbColor(query) ||
        normalizeHslColor(query) ||
        normalizeHwbColor(query);
}
