// gosh is launcher - url detection
// SPDX-License-Identifier: GPL-3.0-or-later

const SCHEME_RE = /^(https?:\/\/|sftp:\/\/|ftp:\/\/|smb:\/\/|davs?:\/\/|www\.|file:\/\/)\S+$/i;
const MAILTO_RE = /^mailto:[^\s@]+@[^\s]+$/i;
const MAGNET_RE = /^magnet:\S+$/i;
const LABEL = '[a-z0-9](?:[a-z0-9-]*[a-z0-9])?';
const DOMAIN_RE = new RegExp(
    `^${LABEL}(?:\\.${LABEL})+(:\\d{1,5})?([/?#]\\S*)?$`,
    'i',
);
const LOCAL_RE = /^(localhost|127\.0\.0\.1)(:\d{1,5})?([/?#]\S*)?$/i;
const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}(:\d{1,5})?([/?#]\S*)?$/;
const IPV6_RE = /^\[([0-9a-f:.]+)\](:\d{1,5})?([/?#]\S*)?$/i;
const BARE_LOOPBACK_V6 = /^::1([/?#]\S*)?$/;
const PRIVATE_SUFFIX_RE = /\.(local|lan|home|internal|home\.arpa)$/i;

// last labels that are almost always files not sites
// even when they collide with a country code such as md or py
const FILE_EXTS = new Set([
    'md', 'py', 'rs', 'ts', 'js', 'jsx', 'tsx', 'c', 'h', 'go', 'rb', 'php',
    'java', 'kt', 'css', 'html', 'htm', 'xml', 'json', 'yml', 'yaml', 'toml',
    'txt', 'log', 'conf', 'ini', 'cfg', 'png', 'jpg', 'jpeg', 'gif', 'svg',
    'webp', 'ico', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'tar', 'gz',
    'mp3', 'mp4', 'wav', 'exe', 'deb', 'rpm', 'so', 'dll', 'vue', 'sql',
    'db', 'lock', 'map', 'wasm', 'dart', 'swift', 'lua', 'zig', 'desktop',
    'service', 'timer', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'env',
]);

// scheme-less hostnames need a real site tld so node.js and readme.md
// stay app and file searches
export function isDottedIpv4(host) {
    const parts = host.split('.');
    if (parts.length !== 4)
        return false;
    for (const part of parts) {
        if (!/^\d{1,3}$/.test(part))
            return false;
        if (Number(part) > 255)
            return false;
    }
    return true;
}

export function isPlausibleWebHost(host) {
    if (!host)
        return false;
    const parts = host.split('.').filter(part => part.length > 0);
    if (parts.length < 2)
        return false;
    const tld = parts[parts.length - 1].toLowerCase();
    if (FILE_EXTS.has(tld))
        return false;
    return /^[a-z]{2,}$/.test(tld);
}

export function isUrlQuery(query) {
    const trimmed = query.trim();
    if (trimmed.length === 0 || /\s/.test(trimmed))
        return false;
    if (/^(javascript|data|vbscript):/i.test(trimmed))
        return false;
    if (SCHEME_RE.test(trimmed) ||
        MAILTO_RE.test(trimmed) ||
        MAGNET_RE.test(trimmed) ||
        LOCAL_RE.test(trimmed) ||
        IPV6_RE.test(trimmed) ||
        BARE_LOOPBACK_V6.test(trimmed))
        return true;
    if (IPV4_RE.test(trimmed))
        return isDottedIpv4(hostOfQuery(trimmed));
    return DOMAIN_RE.test(trimmed) && isPlausibleWebHost(hostOfQuery(trimmed));
}

export function hostOfQuery(query) {
    const trimmed = query.trim();
    if (BARE_LOOPBACK_V6.test(trimmed))
        return '::1';
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
    if (isDottedIpv4(host))
        return 'http';
    if (host.indexOf(':') !== -1)
        return 'http';
    if (PRIVATE_SUFFIX_RE.test(host))
        return 'http';
    return 'https';
}

export function normalizeUrl(query) {
    const trimmed = query.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed))
        return null;
    if (/^(https?:\/\/|sftp:\/\/|ftp:\/\/|smb:\/\/|davs?:\/\/|file:\/\/|mailto:|magnet:)/i.test(trimmed))
        return trimmed;
    if (/^www\./i.test(trimmed))
        return `https://${trimmed}`;
    const host = hostOfQuery(trimmed);
    if (host.indexOf(':') !== -1 && trimmed.charAt(0) !== '[') {
        const rest = trimmed.startsWith(host) ? trimmed.slice(host.length) : '';
        return `${schemeForHost(host)}://[${host}]${rest}`;
    }
    return `${schemeForHost(host)}://${trimmed}`;
}

export function urlRowDescription(url) {
    if (url.startsWith('mailto:'))
        return 'Write email';
    if (url.startsWith('magnet:'))
        return 'Open magnet link';
    if (/^(sftp|ftp|smb|davs?):/i.test(url))
        return 'Open location';
    if (url.startsWith('file:'))
        return 'Open path';
    return 'Open in browser';
}

export function urlRowIcon(url) {
    if (url.startsWith('mailto:'))
        return 'mail-message-new-symbolic';
    if (/^(sftp|ftp|smb|davs?):/i.test(url))
        return 'network-server-symbolic';
    if (url.startsWith('file:'))
        return 'folder-symbolic';
    return 'web-browser-symbolic';
}
