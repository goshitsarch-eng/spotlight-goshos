// gosh is launcher - url detection
// SPDX-License-Identifier: GPL-3.0-or-later

const SCHEME_RE = /^(https?:\/\/|www\.|file:\/\/)\S+$/i;
const LABEL = '[a-z0-9](?:[a-z0-9-]*[a-z0-9])?';
const DOMAIN_RE = new RegExp(
    `^${LABEL}(?:\\.${LABEL})+(:\\d{1,5})?([/?#]\\S*)?$`,
    'i',
);
const LOCAL_RE = /^(localhost|127\.0\.0\.1)(:\d{1,5})?([/?#]\S*)?$/i;
const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}(:\d{1,5})?([/?#]\S*)?$/;
const IPV6_RE = /^\[([0-9a-f:.]+)\](:\d{1,5})?([/?#]\S*)?$/i;

// scheme-less hostnames need a dot so plain words stay app searches
// localhost and dotted ipv4 are the exception because they are typed as sites
export function isUrlQuery(query) {
    const trimmed = query.trim();
    if (trimmed.length === 0 || /\s/.test(trimmed))
        return false;
    return SCHEME_RE.test(trimmed) ||
           DOMAIN_RE.test(trimmed) ||
           LOCAL_RE.test(trimmed) ||
           IPV4_RE.test(trimmed) ||
           IPV6_RE.test(trimmed);
}

export function hostOfQuery(query) {
    const trimmed = query.trim();
    const withoutScheme = trimmed.replace(/^(https?:\/\/|file:\/\/)/i, '');
    const hostPort = withoutScheme.split(/[/?#]/)[0];
    if (hostPort.charAt(0) === '[') {
        const end = hostPort.indexOf(']');
        if (end > 1)
            return hostPort.substring(1, end);
        return '';
    }
    return hostPort.split(':')[0];
}

export function schemeForHost(host) {
    if (/^localhost$/i.test(host))
        return 'http';
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host))
        return 'http';
    if (host.indexOf(':') !== -1)
        return 'http';
    return 'https';
}

export function normalizeUrl(query) {
    const trimmed = query.trim();
    if (/^(https?:\/\/|file:\/\/)/i.test(trimmed))
        return trimmed;
    if (/^www\./i.test(trimmed))
        return `https://${trimmed}`;
    return `${schemeForHost(hostOfQuery(trimmed))}://${trimmed}`;
}
