// gosh is launcher - resolve ~ and ./ against the user home
// SPDX-License-Identifier: GPL-3.0-or-later

// gnome-shell cwd is often / so a home-relative name must be expanded
// before exists checks and before spawn

export function isPathQuery(query) {
    const text = query.trim();
    if (text.length === 0)
        return false;
    if (text === '~' || text.startsWith('~/'))
        return true;
    if (text === '.' || text.startsWith('./'))
        return true;
    if (text === '..' || text.startsWith('../'))
        return true;
    return text.charAt(0) === '/';
}

export function normalizeAbsolute(path) {
    if (!path.startsWith('/'))
        return path;
    const parts = [];
    for (const part of path.split('/')) {
        if (part === '' || part === '.')
            continue;
        if (part === '..') {
            if (parts.length > 0)
                parts.pop();
            continue;
        }
        parts.push(part);
    }
    return `/${parts.join('/')}`;
}

export function expandHomePath(path, home) {
    if (!path)
        return '';
    if (!home)
        return path;

    let raw = path;
    if (path === '~')
        raw = home;
    else if (path.startsWith('~/'))
        raw = `${home}/${path.slice(2)}`;
    else if (path === '.')
        raw = home;
    else if (path.startsWith('./'))
        raw = `${home}/${path.slice(2)}`;
    else if (path === '..')
        raw = `${home}/..`;
    else if (path.startsWith('../'))
        raw = `${home}/${path}`;
    else
        return path;

    return normalizeAbsolute(raw);
}

export function expandHomeArgv(argv, home) {
    return argv.map(arg => expandHomePath(arg, home));
}

// scripts/foo is home-relative spawn cwd is home exists checks are not
export function resolveSpawnPath(path, home) {
    if (!path)
        return '';
    if (path.indexOf('/') === -1)
        return path;
    const expanded = expandHomePath(path, home);
    if (expanded.startsWith('/'))
        return normalizeAbsolute(expanded);
    if (!home)
        return path;
    return normalizeAbsolute(`${home}/${path}`);
}

export function resolveCommandArgv(argv, home) {
    const expanded = expandHomeArgv(argv, home);
    if (expanded.length === 0)
        return expanded;
    return [resolveSpawnPath(expanded[0], home)].concat(expanded.slice(1));
}

export function collapseHomePath(path, home) {
    if (!path)
        return '';
    if (home && path === home)
        return '~';
    if (home && path.startsWith(`${home}/`))
        return `~${path.slice(home.length)}`;
    return path;
}

export function fileUriFromAbsolute(path) {
    return `file://${path.split('/').map(part => encodeURIComponent(part)).join('/')}`;
}

// xbel and gtk bookmarks can carry latin-1 percent bytes decodeURIComponent
// throws on those and one bad href must not take down the whole search
export function decodeUriComponentSafe(text) {
    if (!text)
        return '';
    const safe = text.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
    try {
        return decodeURIComponent(safe);
    } catch (e) {
        return safe;
    }
}

export function pathFromFileUri(uri) {
    const href = uri.split('#')[0].split('?')[0];
    if (!href.toLowerCase().startsWith('file://'))
        return '';
    let raw = href.slice('file://'.length);
    const rawLower = raw.toLowerCase();
    // browsers emit file://localhost/path for a local file
    if (rawLower === 'localhost' || rawLower.startsWith('localhost/'))
        raw = raw.slice('localhost'.length);
    if (!raw.startsWith('/'))
        return '';
    try {
        return decodeURIComponent(raw.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
    } catch (e) {
        return '';
    }
}

function encodeUriPathPart(part) {
    if (!part)
        return '';
    const safe = part.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
    try {
        return encodeURIComponent(decodeURIComponent(safe));
    } catch (e) {
        return safe;
    }
}

function encodeAuthorityUri(uri, pattern) {
    const match = pattern.exec(uri || '');
    if (!match)
        return uri;
    const path = match[3] || '';
    if (!path)
        return uri;
    const encoded = path.split('/').map(encodeUriPathPart).join('/');
    return `${match[1]}://${match[2]}${encoded}${match[4] || ''}`;
}

// gtk bookmarks and xbel often leave spaces in file:// gio rejects those
export function canonicalizeFileUri(uri) {
    if (!uri || !uri.toLowerCase().startsWith('file:'))
        return uri;
    const path = pathFromFileUri(uri);
    if (path)
        return fileUriFromAbsolute(path);
    // file://host/share is not a local path but gio still needs encoding
    return encodeAuthorityUri(uri, /^(file):\/\/([^/]+)(\/[^?#]*)?([?#].*)?$/i);
}

// nautilus and gio also leave spaces in sftp:// and smb://
export function canonicalizeRemoteUri(uri) {
    return encodeAuthorityUri(uri, /^(sftp|ftp|smb|davs?):\/\/([^/]+)(\/[^?#]*)?([?#].*)?$/i);
}

export function canonicalizeLaunchUri(uri) {
    if (!uri)
        return uri;
    if (uri.toLowerCase().startsWith('file:'))
        return canonicalizeFileUri(uri);
    if (/^(sftp|ftp|smb|davs?):/i.test(uri))
        return canonicalizeRemoteUri(uri);
    return uri;
}
