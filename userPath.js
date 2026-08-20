// gosh is launcher - extra dirs the shell path often omits
// SPDX-License-Identifier: GPL-3.0-or-later

export function extraPathDirs(home) {
    const dirs = [];
    if (home) {
        dirs.push(
            `${home}/.local/bin`,
            `${home}/.local/share/flatpak/exports/bin`,
            `${home}/.cargo/bin`,
            `${home}/go/bin`,
            `${home}/bin`,
        );
    }
    // gnome-shell path often omits the system flatpak export dir
    dirs.push('/var/lib/flatpak/exports/bin');
    return dirs;
}

export function joinPathDirs(extraDirs, currentPath) {
    const parts = extraDirs.slice();
    if (currentPath)
        parts.push(currentPath);
    return parts.join(':');
}

export function findUserProgram(name, findInPath, pathExists, extraDirs) {
    if (!name)
        return null;
    const found = findInPath(name);
    if (found)
        return found;
    for (const dir of extraDirs) {
        const candidate = `${dir}/${name}`;
        if (pathExists(candidate))
            return candidate;
    }
    return null;
}
