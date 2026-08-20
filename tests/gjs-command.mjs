import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import {commandIsReady, firstCommandArg, commandUsesPathLookup} from '../commandReady.js';
import {expandHomePath} from '../homePath.js';

if (firstCommandArg(['true', '-h']) !== 'true')
    throw new Error('first arg');
if (!commandUsesPathLookup('true'))
    throw new Error('true uses PATH');
if (commandUsesPathLookup('/bin/true'))
    throw new Error('absolute skips PATH');

if (!commandIsReady('true', GLib.find_program_in_path, () => false))
    throw new Error('true should be on PATH');
if (commandIsReady('gosh-no-such-cmd-9f3a', GLib.find_program_in_path, () => false))
    throw new Error('missing command should not be ready');

const absTrue = GLib.find_program_in_path('true');
if (!absTrue)
    throw new Error('need true on this image');
if (!commandIsReady(absTrue, () => null, path => Gio.File.new_for_path(path).query_exists(null)))
    throw new Error('absolute true should exist');
if (commandIsReady('/no/such/gosh-cmd', () => '/bin/true', () => false))
    throw new Error('missing absolute should not be ready');

const trueDir = GLib.path_get_dirname(absTrue);
const homeRelative = expandHomePath('./true', trueDir);
if (!commandIsReady(homeRelative, () => null, path => Gio.File.new_for_path(path).query_exists(null)))
    throw new Error('home-relative true should exist');

print('gjs command helpers ok');
