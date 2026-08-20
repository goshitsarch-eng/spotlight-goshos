// gosh is launcher - url detection
// SPDX-License-Identifier: GPL-3.0-or-later

const SCHEME_RE = /^(https?:\/\/|www\.)\S+$/i;
const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+([/?#]\S*)?$/i;

// scheme-less hostnames need a dot so plain words stay app searches
export function isUrlQuery(query) {
    const trimmed = query.trim();
    if (trimmed.length === 0 || /\s/.test(trimmed))
        return false;
    return SCHEME_RE.test(trimmed) || DOMAIN_RE.test(trimmed);
}

export function normalizeUrl(query) {
    const trimmed = query.trim();
    if (/^https?:\/\//i.test(trimmed))
        return trimmed;
    return `https://${trimmed}`;
}
