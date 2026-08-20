// gosh is launcher - xdg user folder provider
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import {matchPlaces, takeUniquePlaces} from './placeMatch.js';
import {collapseHomePath, fileUriFromAbsolute} from './homePath.js';
import {openUri, spawnArgv, findInUserPath} from './gioLaunch.js';
import {terminalCommand, terminalRowMeta} from './terminalLaunch.js';

function _placePath(id) {
    if (id === 'home')
        return GLib.get_home_dir();
    if (id === 'desktop')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP);
    if (id === 'documents')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOCUMENTS);
    if (id === 'download')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD);
    if (id === 'music')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC);
    if (id === 'pictures')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES);
    if (id === 'videos')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_VIDEOS);
    if (id === 'public')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PUBLIC_SHARE);
    if (id === 'templates')
        return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_TEMPLATES);
    return null;
}

export function searchPlaces(query, maxResults) {
    const home = GLib.get_home_dir() || '';
    const matches = takeUniquePlaces(matchPlaces(query), _placePath, maxResults);
    const rows = matches.map(({place, path}) => ({
        type: 'place',
        title: place.title,
        description: collapseHomePath(path, home),
        icon: place.icon,
        id: place.id,
        activate: () => {
            openUri(fileUriFromAbsolute(path));
        },
    }));
    if (matches.length === 0 || rows.length >= maxResults)
        return rows;
    const command = terminalCommand(name => findInUserPath(name), matches[0].path);
    if (!command)
        return rows;
    const term = terminalRowMeta(matches[0].path, home, 'place');
    term.activate = () => spawnArgv(command.argv, command.cwd);
    rows.push(term);
    return rows;
}
