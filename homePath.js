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

export function fileUriFromAbsolute(path) {
    return `file://${path.split('/').map(part => encodeURIComponent(part)).join('/')}`;
}
