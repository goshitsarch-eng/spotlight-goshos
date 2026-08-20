import {evaluateArithmetic, formatNumber, normalizeMath, formatHex, calculatorDescription} from '../calculator.js';
import {parseUnitQuery, convertUnits, convertQuery, formatUnitValue, normalizeUnitQuery} from '../unitMatch.js';
import {isNewWindowAction, newWindowTitle, desktopActionTitle, takeAppActions, actionResultLimit} from '../appAction.js';
import {parseQuery, PREFIXES, isPrefixToken} from '../prefixParser.js';
import {isUrlQuery, normalizeUrl, hostOfQuery, schemeForHost, isPlausibleWebHost, isDottedIpv4, urlRowDescription, urlRowIcon} from '../urlMatch.js';
import {canOpenPopup, shouldCloseOnToggle} from '../popupGate.js';
import {popupOrigin, popupWidthForWorkArea, resultsMaxHeightForWorkArea} from '../popupPosition.js';
import {backdropBox, backdropPointerAction} from '../backdropBox.js';
import {THEMES, getTheme, getThemeIds, applyLookSettings, iconSizeForLook, shouldApplyLook} from '../themes.js';
import {SEARCH_ENGINES, getEngine} from '../webEngines.js';
import {getSectionTitle, getSectionTypes} from '../sectionTitles.js';
import {actionMatchesQuery} from '../actionMatch.js';
import {planSearch, flagsFromSettings, isActiveSearchQuery, shouldRefreshRecentFiles, shouldRefreshPath, shouldRefreshCommand, shouldRefreshBookmarks, mergeEmptySuggestions} from '../searchPlan.js';
import {wordPrefixMatch, textMatchesQuery, SUBSTRING_MIN} from '../wordMatch.js';
import {appMatchTier, appBaseName, takeUniqueByBaseName, appRowDescription} from '../appMatch.js';
import {rowPointerAction, PRIMARY_BUTTON} from '../resultPointer.js';
import {matchSettingsPanels, SETTINGS_PANELS, settingsArgv} from '../settingsPanels.js';
import {nextSelectedIndex} from '../selectionMath.js';
import {attachScrollChild, applyScrollPolicy, getVerticalAdjustment} from '../scrollView.js';
import {parseRecentXbel, basenameFromUri, iconForBasename, recentExistsShouldSettle, RECENT_EXISTS_BUDGET_MS, pathFromFileUri, parentPathFromFileUri, recentFileMatches} from '../recentXbel.js';
import {readPreedit, shouldPropagateForPreedit} from '../entryPreedit.js';
import {resolveKeyAction, resolveHomeEndAction, resolveCtrlNav, isNavAction} from '../keyAction.js';
import {shouldOfferApp} from '../appReady.js';
import {activateResultSafe} from '../resultActivate.js';
import {firstCommandArg, commandUsesPathLookup, commandIsReady, commandRowMeta} from '../commandReady.js';
import {isPathQuery, expandHomePath, expandHomeArgv, normalizeAbsolute, fileUriFromAbsolute, collapseHomePath} from '../homePath.js';
import {pathRowMeta} from '../pathMatch.js';
import {terminalSpec, terminalCommand, terminalRowMeta} from '../terminalLaunch.js';
import {placeMatches, matchPlaces, PLACE_CATALOG, takeUniquePlaces} from '../placeMatch.js';
import {parseGtkBookmarks, mergeBookmarkFiles, bookmarkTitle, bookmarkDescription, bookmarkMatches, matchBookmarks, bookmarkIcon, hostFromUri} from '../bookmarkParse.js';
import {timeQueryKind, formatClock, formatDateTitle, weekdayName, monthName, formatIsoDate} from '../timeMatch.js';
import {normalizeHexColor, normalizeRgbColor, normalizeHslColor, normalizeHwbColor, normalizeColor} from '../colorMatch.js';
import {paintSelectionIndex} from '../paintSelection.js';
import {buildAccelerator, modifiersFromMask, normalizeAccelKey, formatAccelerator, formatShortcutList, isModifierKeyName} from '../shortcutAccel.js';
import {collectSearchResults} from '../searchRun.js';
import {windowMatches, windowClassText, shouldListWindow, sortWindowsMostRecent, windowWorkspaceLabel, workspaceLabelMatches} from '../windowMatch.js';
import {parseWindowCloseQuery, windowCloseTitle, shouldForceQuitWindow} from '../windowClose.js';
import {parseWorkspaceSwitchQuery, workspaceSwitchTitle, workspaceIndexInRange} from '../workspaceQuery.js';
import {readdirSync, readFileSync} from 'node:fs';

let failed = 0;
let passed = 0;

function assert(cond, message) {
    if (cond) {
        passed++;
        return;
    }
    failed++;
    console.error(`FAIL: ${message}`);
}

function assertEq(actual, expected, message) {
    assert(actual === expected, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

// calculator regressions and new power operator
assertEq(evaluateArithmetic('12 * 8 + 3'), 99, '12 * 8 + 3');
assertEq(evaluateArithmetic('2^8'), 256, 'power');
assertEq(evaluateArithmetic('2^3^2'), 512, 'power is right-associative');
assertEq(evaluateArithmetic('(1+2)*3'), 9, 'parens');
assertEq(evaluateArithmetic('10 / 4'), 2.5, 'division');
assertEq(evaluateArithmetic('10 % 3'), 1, 'modulo');
assertEq(evaluateArithmetic('1/0'), null, 'divide by zero');
assertEq(evaluateArithmetic('not math'), null, 'reject non-math');
assertEq(evaluateArithmetic('42'), null, 'require an operator');
assertEq(evaluateArithmetic('42', true), 42, 'bare number allowed when asked');
assertEq(evaluateArithmetic('1,000', true), 1000, 'bare thousands comma');
assertEq(evaluateArithmetic('0.5', true), 0.5, 'bare float allowed when asked');
assertEq(formatNumber(0.1 + 0.2), '0.3', 'float rounding');
assertEq(formatNumber(-0), '0', 'negative zero');
assertEq(formatNumber(256), '256', 'integers stay integers');

// prefixes
assertEq(parseQuery('chrome').mode, 'all', 'plain query');
assertEq(parseQuery('= 2+2').mode, 'calculator', 'calc prefix');
assertEq(parseQuery('=2+2').query, '2+2', 'calc query strip');
assertEq(parseQuery('@ gnome').mode, 'web', 'web prefix');
assertEq(parseQuery('# wifi').mode, 'settings', 'settings prefix');
assertEq(parseQuery('#ff0000').mode, 'all', 'hex color is not settings prefix');
assertEq(parseQuery('#').mode, 'settings', 'hash alone is settings');
assertEq(parseQuery('$ term').mode, 'windows', 'windows prefix');
assertEq(parseQuery('. notes').mode, 'files', 'files prefix');
assertEq(parseQuery('! ls -la').mode, 'command', 'command prefix');
assertEq(parseQuery('   ').query, '', 'empty trim');
assert(Object.keys(PREFIXES).length === 6, 'expected six prefixes');
assertEq(parseQuery('.bashrc').mode, 'all', 'dotfile is not files prefix');
assertEq(parseQuery('.bashrc').query, '.bashrc', 'dotfile keeps the name');
assertEq(parseQuery('./run').mode, 'all', 'relative path is not files prefix');
assertEq(parseQuery('. notes').mode, 'files', 'dot space is files prefix');
assertEq(parseQuery('.').mode, 'files', 'dot alone is files prefix');
assertEq(parseQuery('$HOME').mode, 'all', 'env var is not windows prefix');
assertEq(parseQuery('$ term').mode, 'windows', 'dollar space is windows prefix');
assertEq(parseQuery('$').mode, 'windows', 'dollar alone is windows prefix');
assertEq(parseQuery('=2+2').mode, 'calculator', 'equals still sticks without space');
assert(isPrefixToken('. notes', '.'), 'dot space token');
assert(!isPrefixToken('.bashrc', '.'), 'dotfile is not a token');

// urls
assert(isUrlQuery('file:///tmp/notes.txt'), 'file url');
assertEq(normalizeUrl('file:///tmp/notes.txt'), 'file:///tmp/notes.txt', 'keep file scheme');
assert(isUrlQuery('https://example.com'), 'https url');
assert(isUrlQuery('www.example.com'), 'www url');
assert(isUrlQuery('example.com'), 'bare domain');
assert(isUrlQuery('http://example.com/path?q=1'), 'http with path');
assert(isUrlQuery('example.com/foo'), 'domain with path');
assert(!isUrlQuery('chrome'), 'plain word is not a url');
assert(!isUrlQuery('hello world'), 'spaces are not a url');
assert(!isUrlQuery(''), 'empty is not a url');
assertEq(normalizeUrl('example.com'), 'https://example.com', 'add https');
assertEq(normalizeUrl('https://ok.test'), 'https://ok.test', 'keep scheme');
assertEq(normalizeUrl('www.ok.test'), 'https://www.ok.test', 'www gets https');
assert(isUrlQuery('localhost:3000'), 'localhost port');
assert(isUrlQuery('127.0.0.1'), 'loopback');
assert(isDottedIpv4('192.168.0.1'), 'valid ipv4');
assert(!isDottedIpv4('999.999.999.999'), 'octet too large');
assert(!isUrlQuery('999.999.999.999'), 'invalid ipv4 is not a url');
assert(isUrlQuery('192.168.1.1:8080'), 'lan port');
assert(isUrlQuery('example.com:3000'), 'domain port');
assert(!isUrlQuery('localhostx'), 'localhost prefix is not a url');
assertEq(normalizeUrl('localhost:3000'), 'http://localhost:3000', 'local uses http');
assertEq(normalizeUrl('10.0.0.5'), 'http://10.0.0.5', 'lan uses http');
assertEq(normalizeUrl('example.com:3000'), 'https://example.com:3000', 'public keeps https');
assertEq(hostOfQuery('https://a.test:80/x'), 'a.test', 'host strips scheme port path');
assertEq(schemeForHost('localhost'), 'http', 'localhost scheme');
assertEq(schemeForHost('example.com'), 'https', 'public scheme');
assert(isUrlQuery('[::1]:8080'), 'ipv6 loopback port');
assert(isUrlQuery('http://[fe80::1]/'), 'ipv6 scheme');
assertEq(hostOfQuery('[::1]:8080'), '::1', 'ipv6 host');
assertEq(normalizeUrl('[::1]:3000'), 'http://[::1]:3000', 'ipv6 uses http');
assertEq(schemeForHost('::1'), 'http', 'ipv6 scheme http');
assert(isUrlQuery('::1'), 'bare ipv6 loopback');
assertEq(hostOfQuery('::1'), '::1', 'bare ipv6 host');
assertEq(normalizeUrl('::1'), 'http://[::1]', 'bare ipv6 gets brackets');
assertEq(normalizeUrl('::1/status'), 'http://[::1]/status', 'bare ipv6 keeps path');
assert(!isUrlQuery('node.js'), 'js file is not a url');
assert(!isUrlQuery('readme.md'), 'markdown is not a url');
assert(!isUrlQuery('package.json'), 'json is not a url');
assert(!isUrlQuery('photo.png'), 'image is not a url');
assert(!isPlausibleWebHost('node.js'), 'js tld rejected');
assert(isUrlQuery('site.de'), 'country domain is a url');
assert(isUrlQuery('nas.local'), 'mdns host is a url');
assertEq(normalizeUrl('nas.local'), 'http://nas.local', 'mdns uses http');
assert(isUrlQuery('sftp://nas.local/share'), 'sftp url');
assert(isUrlQuery('smb://nas/public'), 'smb url');
assert(isUrlQuery('mailto:nin@example.com'), 'mailto url');
assert(isUrlQuery('magnet:?xt=urn:btih:abc'), 'magnet url');
assert(!isUrlQuery('javascript:alert(1)'), 'javascript is not a url');
assertEq(normalizeUrl('sftp://nas/share'), 'sftp://nas/share', 'keep sftp scheme');
assertEq(urlRowDescription('sftp://nas/share'), 'Open location', 'sftp copy');
assertEq(urlRowDescription('mailto:a@b.c'), 'Write email', 'mailto copy');
assertEq(urlRowIcon('file:///tmp'), 'folder-symbolic', 'file url icon');
assertEq(schemeForHost('printer.local'), 'http', 'local suffix is http');
assertEq(schemeForHost('box.lan'), 'http', 'lan suffix is http');

assert(canOpenPopup(false, false, false, false), 'idle can open');
assert(!canOpenPopup(true, false, false, false), 'open flag blocks');
assert(!canOpenPopup(false, true, false, false), 'visible blocks');
assert(!canOpenPopup(false, false, true, false), 'lock screen blocks');
assert(!canOpenPopup(false, false, false, true), 'greeter blocks');
assert(shouldCloseOnToggle(true, false), 'idle gap still toggles closed');
assert(shouldCloseOnToggle(false, true), 'visible toggles closed');
assert(!shouldCloseOnToggle(false, false), 'closed stays closed');

const work = {x: 100, y: 40, width: 1800, height: 1000};
assertEq(popupOrigin(work, 600, 80, 'center').x, 700, 'center x in work area');
assertEq(popupOrigin(work, 600, 80, 'center').y, 500, 'center y in work area');
assertEq(popupOrigin(work, 600, 80, 'top').y, 160, 'top is 12 percent into work area');
const tiny = {x: 0, y: 0, width: 400, height: 300};
assertEq(popupOrigin(tiny, 600, 80, 'center').x, 0, 'wide popup pins to work left');
assertEq(popupOrigin(tiny, 200, 400, 'center').y, 0, 'tall popup pins to work top');
assertEq(popupOrigin({x: 50, y: 20, width: 400, height: 300}, 600, 80, 'center').x, 50, 'pin keeps work origin');
assertEq(popupWidthForWorkArea(600, 1920), 600, 'wide work keeps request');
assertEq(popupWidthForWorkArea(1200, 800), 800, 'narrow work shrinks popup');
assertEq(popupWidthForWorkArea(600, 0), 600, 'unknown work keeps request');
assertEq(resultsMaxHeightForWorkArea(400, 900), 400, 'tall work keeps request');
assertEq(resultsMaxHeightForWorkArea(800, 220), 220, 'short work shrinks results');
assertEq(resultsMaxHeightForWorkArea(400, 0), 0, 'no space below hides overflow');
assertEq(resultsMaxHeightForWorkArea(400, -20), 0, 'negative space hides overflow');

const span = backdropBox([
    {x: 0, y: 0, width: 1920, height: 1080},
    {x: 1920, y: 0, width: 1280, height: 1024},
]);
assertEq(span.x, 0, 'backdrop left');
assertEq(span.y, 0, 'backdrop top');
assertEq(span.width, 3200, 'backdrop spans both widths');
assertEq(span.height, 1080, 'backdrop uses tallest monitor');
assertEq(backdropBox([]).width, 0, 'empty monitors');
assertEq(backdropBox([{x: 100, y: 40, width: 800, height: 600}]).x, 100, 'single monitor x');
assertEq(backdropPointerAction('button-press'), 'stop', 'press is swallowed');
assertEq(backdropPointerAction('button-release'), 'close', 'release closes');
assertEq(backdropPointerAction('touch-begin'), 'stop', 'touch begin swallowed');
assertEq(backdropPointerAction('touch-update'), 'stop', 'touch move swallowed');
assertEq(backdropPointerAction('touch-cancel'), 'stop', 'touch cancel swallowed');
assertEq(backdropPointerAction('touch-end'), 'close', 'touch end closes');
assertEq(backdropPointerAction('scroll'), 'propagate', 'scroll ignored');
assertEq(rowPointerAction('press', PRIMARY_BUTTON, false).action, 'stop', 'row press claimed');
assertEq(rowPointerAction('release', PRIMARY_BUTTON, true).action, 'activate', 'row release activates');
assertEq(rowPointerAction('release', PRIMARY_BUTTON, false).action, 'propagate', 'release without press');
assertEq(rowPointerAction('leave', PRIMARY_BUTTON, true).pressed, false, 'leave cancels press');
assertEq(rowPointerAction('press', 3, false).action, 'propagate', 'right click ignored');

// catalogs stay aligned
const themeIds = getThemeIds();
assert(themeIds.includes('omarchy'), 'omarchy theme');
assert(themeIds.includes('popos'), 'popos theme');
assert(themeIds.includes('ulauncher'), 'ulauncher theme');
assert(themeIds.includes('krunner'), 'krunner theme');
assert(themeIds.includes('gnome'), 'gnome theme');
assert(themeIds.includes('rofi'), 'rofi theme');
assert(themeIds.includes('raycast'), 'raycast theme');
assert(themeIds.includes('albert'), 'albert theme');
assert(themeIds.includes('wofi'), 'wofi theme');
assert(themeIds.includes('fuzzel'), 'fuzzel theme');
assert(themeIds.includes('anyrun'), 'anyrun theme');
assert(themeIds.includes('tofi'), 'tofi theme');
assert(themeIds.includes('light'), 'light theme');
assert(themeIds.includes('powertoys'), 'powertoys theme');
assert(themeIds.includes('synapse'), 'synapse theme');
assert(themeIds.includes('onagre'), 'onagre theme');
assert(themeIds.includes('spotlight'), 'spotlight theme');
assertEq(getTheme('missing').id, 'spotlight', 'unknown theme falls back');

const schema = readFileSync('schemas/org.gnome.shell.extensions.gosh-is-launcher.gschema.xml', 'utf8');
for (const id of themeIds)
    assert(schema.includes(`<choice value="${id}"/>`), `schema has theme ${id}`);

for (const engine of SEARCH_ENGINES)
    assert(schema.includes(`<choice value="${engine.id}"/>`), `schema has engine ${engine.id}`);
assertEq(getEngine('kagi').label, 'Kagi', 'kagi engine');
assertEq(getEngine('nope').id, 'google', 'unknown engine falls back');

const types = getSectionTypes();
for (const type of ['app', 'app-action', 'calculator', 'unit', 'color', 'window', 'window-close', 'workspace', 'system-action', 'settings', 'file', 'path', 'place', 'bookmark', 'time', 'url', 'command', 'web'])
    assert(types.includes(type), `section type ${type}`);
assertEq(getSectionTitle('window'), 'Windows', 'window title');
assertEq(getSectionTitle('window-close'), 'Close Window', 'close window title');
assertEq(getSectionTitle('workspace'), 'Workspaces', 'workspace title');
assertEq(getSectionTitle('app-action'), 'Actions', 'app action title');

assert(actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'loc'), 'action prefix');
assert(actionMatchesQuery({title: 'Lock Screen', keywords: ['Lock']}, 'lock'), 'action keyword case');
assert(!actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'firefox'), 'action miss');
assert(!actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'clock'), 'clock is not lock');
assert(!actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'o'), 'single letter is not lock');

const metadata = JSON.parse(readFileSync('metadata.json', 'utf8'));
assertEq(metadata.uuid, 'gosh-is-launcher@nin', 'uuid renamed');
assertEq(metadata.name, 'Gosh Is Launcher', 'display name');
assertEq(metadata['settings-schema'], 'org.gnome.shell.extensions.gosh-is-launcher', 'schema id');
assert(metadata.description.includes('CLIPBOARD ACCESS'), 'clipboard declaration');
assert(metadata['version-name'].length <= 16, 'version-name length');
assert(metadata['shell-version'].join(',') === '45,46,47,48,49,50', 'shell versions');
assert(metadata.description.includes('screenshot'), 'screenshot in metadata');

// more calculator edges
assertEq(evaluateArithmetic('-3 + 5'), 2, 'unary minus');
assertEq(evaluateArithmetic('2 * -4'), -8, 'times unary minus');
assertEq(evaluateArithmetic('10 / 0'), null, 'div zero alias');
assertEq(evaluateArithmetic('8 % 0'), null, 'mod zero');
assertEq(evaluateArithmetic('((2+3)*4)'), 20, 'nested parens');
assertEq(evaluateArithmetic('2 ^ 0'), 1, 'power zero');
assertEq(evaluateArithmetic('0.5 * 2'), 1, 'decimal');
assertEq(evaluateArithmetic('2 + - 3'), -1, 'plus unary minus with spaces');
assertEq(normalizeMath('2×3'), '2*3', 'unicode times');
assertEq(normalizeMath('8÷2'), '8/2', 'unicode divide');
assertEq(normalizeMath('5−1'), '5-1', 'unicode minus');
assertEq(normalizeMath('1,000,000+2'), '1000000+2', 'thousands commas');
assertEq(evaluateArithmetic('2×3'), 6, 'unicode times evaluates');
assertEq(evaluateArithmetic('8÷2'), 4, 'unicode divide evaluates');
assertEq(evaluateArithmetic('1,000+2'), 1002, 'thousands comma evaluates');
assertEq(evaluateArithmetic('5−1'), 4, 'unicode minus evaluates');
assertEq(evaluateArithmetic('-(2+3)'), -5, 'unary minus on group');
assertEq(evaluateArithmetic('2^3*2'), 16, 'power before multiply');
assertEq(evaluateArithmetic('2**8'), 256, 'python power');
assertEq(evaluateArithmetic('2 x 3'), 6, 'spaced x multiply');
assertEq(evaluateArithmetic('2x3'), 6, 'tight x multiply');
assertEq(evaluateArithmetic('0x10'), null, 'bare hex stays a search');
assertEq(evaluateArithmetic('0x10', true), 16, 'bare hex allowed when asked');
assertEq(evaluateArithmetic('0x10+1'), 17, 'hex plus');
assertEq(evaluateArithmetic('0xff * 2'), 510, 'hex multiply');
assertEq(evaluateArithmetic('0b1010', true), 10, 'bare binary');
assertEq(evaluateArithmetic('0b10+0b10'), 4, 'binary plus');
assertEq(evaluateArithmetic('2x3'), 6, 'tight x still multiply');
assertEq(formatHex(255), '0xff', 'hex copy hint');
assertEq(formatHex(-1), '', 'negative has no hex hint');
assertEq(calculatorDescription(255), '0xff · press Enter to copy', 'hex description');
assertEq(calculatorDescription(0.5), 'Press Enter to copy to clipboard', 'float description');
assertEq(evaluateArithmetic('50% of 80'), 40, 'percent of');
assertEq(evaluateArithmetic('25 percent of 200'), 50, 'percent word of');
assertEq(evaluateArithmetic('50%'), 0.5, 'postfix percent is a fraction');
assertEq(evaluateArithmetic('50% * 80'), 40, 'postfix percent multiply');
assertEq(evaluateArithmetic('10%3'), 1, 'infix percent stays modulo');
assertEq(evaluateArithmetic('50 %'), 0.5, 'spaced postfix percent');
assertEq(evaluateArithmetic('sqrt(16)'), 4, 'sqrt');
assertEq(evaluateArithmetic('√16'), 4, 'unicode sqrt');
assertEq(evaluateArithmetic('abs(-3)'), 3, 'abs');
assertEq(evaluateArithmetic('sin(90)'), 1, 'sin uses degrees');
assertEq(evaluateArithmetic('2pi / 2'), Math.PI, 'implicit 2pi');
assertEq(evaluateArithmetic('2(3+1)'), 8, 'implicit paren multiply');
assertEq(evaluateArithmetic('pi'), Math.PI, 'bare pi');
assertEq(evaluateArithmetic('2*e'), 2 * Math.E, 'euler e');
assertEq(evaluateArithmetic('e'), null, 'bare e stays a search');
assertEq(evaluateArithmetic('sqrt'), null, 'function needs parens');
assertEq(evaluateArithmetic('0xff'), null, 'bare hex still a search');
assertEq(evaluateArithmetic('log(100)'), 2, 'log10');
assertEq(evaluateArithmetic('ln(1)'), 0, 'natural log');
assertEq(evaluateArithmetic('5!'), 120, 'factorial');
assertEq(evaluateArithmetic('3!+1'), 7, 'factorial then add');
assertEq(evaluateArithmetic('(-3)!'), null, 'negative factorial rejected');
assertEq(parseUnitQuery('10 km to mi').from, 'km', 'unit from');
assertEq(parseUnitQuery('10km to miles').to, 'miles', 'unit to alias');
assertEq(parseUnitQuery('32°f to c').from, 'f', 'degree symbol');
assertEq(parseUnitQuery('32 degrees f to c').from, 'f', 'degrees word');
assertEq(convertQuery('32°f to c').title, '0 c', '32 f is 0 c with degree');
assertEq(normalizeUnitQuery('32°C to F').includes('C'), true, 'degree stripped');
assertEq(parseUnitQuery('chrome'), null, 'plain word is not a unit query');
assertEq(convertUnits(10, 'km', 'mi').toId, 'mi', 'km to mi id');
assertEq(Math.round(convertUnits(10, 'km', 'mi').value * 1000) / 1000, 6.214, '10 km is 6.214 mi');
assertEq(convertUnits(32, 'f', 'c').value, 0, '32 f is 0 c');
assertEq(convertUnits(0, 'c', 'k').value, 273.15, '0 c is 273.15 k');
assertEq(convertUnits(1, 'gb', 'mib').toId, 'mib', 'data decimal to binary');
assertEq(convertUnits(1, 'kg', 'km'), null, 'cross dimension rejected');
assertEq(convertUnits(5, 'km', 'km'), null, 'same unit rejected');
assertEq(convertQuery('100 kg to lb').title.split(' ')[1], 'lb', 'query title unit');
assertEq(convertQuery('2 cups to ml').description, '2 cup', 'query source');
assertEq(convertUnits(1, 'nmi', 'm').value, 1852, 'nautical mile');
assertEq(Math.round(convertUnits(1, 'st', 'kg').value * 1000) / 1000, 6.35, 'stone to kg');
assertEq(convertQuery('1 stone to kg').title.split(' ')[1], 'kg', 'stone query');
assertEq(formatUnitValue(0), '0', 'unit zero');
assert(isNewWindowAction('new-window'), 'hyphen new window');
assert(isNewWindowAction('new_window'), 'underscore new window');
assert(!isNewWindowAction('new-private-window'), 'private window stays');
assertEq(newWindowTitle('Firefox'), 'New window — Firefox', 'new window title');
assertEq(desktopActionTitle('New Private Window', 'Firefox'), 'New Private Window — Firefox', 'desktop action title');
assertEq(takeAppActions(['a', 'b', 'c'], 2).join(','), 'a,b', 'action cap');
assertEq(takeAppActions(['a'], 0).length, 0, 'zero actions');
assertEq(actionResultLimit(6, 6), 6, 'actions keep their own category cap');
assertEq(takeAppActions(['new', 'private'], actionResultLimit(6, 6)).length, 2, 'full app list still offers actions');
assertEq(evaluateArithmetic('1e3+2'), 1002, 'scientific notation');
assertEq(evaluateArithmetic('1e-3*1000'), 1, 'scientific negative exponent');
assertEq(evaluateArithmetic('2·3'), 6, 'middle-dot multiply');
assertEq(evaluateArithmetic('2+2\n'), 4, 'pasted newline is ignored');
assertEq(formatNumber(1.2300000000001), '1.23', 'trim float noise');

// word prefix
assertEq(appMatchTier('Firefox', 'Web Browser', 'firefox.desktop', ['browser'], 'fire'), 0, 'name prefix');
assertEq(appMatchTier('Google Chrome', '', 'google-chrome.desktop', [], 'chro'), 1, 'word prefix');
assertEq(appMatchTier('Firefox', 'Web Browser', 'org.mozilla.firefox.desktop', [], 'browser'), 3, 'generic name');
assertEq(appMatchTier('Firefox', '', 'org.mozilla.firefox.desktop', [], 'mozilla'), 4, 'desktop id');
assertEq(appMatchTier('Firefox', '', 'firefox.desktop', ['Internet', 'Browser'], 'browser'), 5, 'keyword');
assertEq(appMatchTier('Firefox', '', 'firefox.desktop', ['browser'], ''), -1, 'empty query no app');
assertEq(appMatchTier('Notes', '', 'notes.desktop', [], 'chrome'), -1, 'app miss');
assertEq(appMatchTier('Notes', '', 'notes.desktop', [], 'write', 'Write notes and lists'), 6, 'desktop comment');
assertEq(appMatchTier('Documents', '', 'org.gnome.Nautilus.desktop', [], 'o'), -1, 'letter o is not documents');
assertEq(appMatchTier('Firefox', '', 'firefox.desktop', [], 'f'), 0, 'single letter prefix still matches');
assertEq(appRowDescription(0), 'Application', 'closed app copy');
assertEq(appRowDescription(2), 'Switch to application', 'running app copy');
assertEq(appBaseName('Firefox ESR'), 'firefox', 'esr suffix');
assertEq(appBaseName('GNOME-Builder'), 'gnome-builder', 'hyphenated name stays');
assertEq(appBaseName('Chromium'), 'chromium', 'plain name');
const variants = [
    {title: 'Firefox ESR', usage: 1},
    {title: 'Firefox', usage: 50},
];
variants.sort((a, b) => b.usage - a.usage);
const uniqueApps = takeUniqueByBaseName(variants, item => item.title, 6);
assertEq(uniqueApps.length, 1, 'variant collapsed after sort');
assertEq(uniqueApps[0].title, 'Firefox', 'usage winner kept not install order');
assertEq(takeUniqueByBaseName(variants, item => item.title, 0).length, 0, 'zero max keeps none');

assertEq(SUBSTRING_MIN, 3, 'substring floor');
assert(textMatchesQuery('Workspace 2', '2'), 'workspace number is a word');
assert(!textMatchesQuery('Workspace 1', 'o'), 'letter o is not workspace');
assert(wordPrefixMatch('google chrome', 'chro'), 'chro matches chrome word');
assert(!wordPrefixMatch('google chrome', 'ogle'), 'mid-word is not prefix');
assert(wordPrefixMatch('gnome-builder', 'bui'), 'hyphen boundary');
assert(wordPrefixMatch('foo bar', 'bar'), 'last word');
assert(wordPrefixMatch('notes.txt', 'txt'), 'dot boundary');
assert(!wordPrefixMatch('chrome', 'chro'), 'first word is startsWith not wordPrefix');

// settings matching
assert(matchSettingsPanels('wifi', 5).some(p => p.id === 'wifi'), 'wifi panel');
assert(matchSettingsPanels('wi-fi', 5).some(p => p.id === 'wifi'), 'wi-fi hyphen');
assert(matchSettingsPanels('display', 5).some(p => p.id === 'display'), 'displays');
assert(matchSettingsPanels('appearance', 5).some(p => p.id === 'background'), 'appearance is background on gnome 50');
assert(matchSettingsPanels('wallpaper', 5).some(p => p.id === 'background'), 'wallpaper is background');
assert(matchSettingsPanels('dark', 5).some(p => p.id === 'background'), 'dark style is background');
assert(matchSettingsPanels('ssh', 5).some(p => p.id === 'system'), 'ssh is system on gnome 50');
assert(matchSettingsPanels('remote desktop', 5).some(p => p.id === 'system'), 'remote desktop is system');
assert(matchSettingsPanels('wellbeing', 5).some(p => p.id === 'wellbeing'), 'wellbeing');
assert(matchSettingsPanels('wireless', 5).some(p => p.id === 'wifi'), 'wifi keyword');
assert(matchSettingsPanels('a11y', 5).some(p => p.id === 'universal-access'), 'a11y keyword');
assert(matchSettingsPanels('wacom', 5).some(p => p.id === 'wacom'), 'wacom panel');
assert(matchSettingsPanels('stylus', 5).some(p => p.id === 'wacom'), 'stylus keyword');
assert(matchSettingsPanels('user-accounts', 5).some(p => p.id === 'users'), 'user-accounts alias');
assert(matchSettingsPanels('info-overview', 5).some(p => p.id === 'about'), 'info-overview alias');
assert(matchSettingsPanels('camera', 5).some(p => p.id === 'privacy'), 'camera is privacy');
assert(matchSettingsPanels('location', 5).some(p => p.id === 'privacy'), 'location is privacy');
assert(matchSettingsPanels('microphone', 5).some(p => p.id === 'privacy'), 'microphone is privacy');
assert(matchSettingsPanels('thunderbolt', 5).some(p => p.id === 'privacy'), 'thunderbolt is privacy');
assert(matchSettingsPanels('firmware', 5).some(p => p.id === 'privacy'), 'firmware is privacy');
assert(matchSettingsPanels('security', 5).some(p => p.id === 'privacy'), 'security is privacy title');
assert(matchSettingsPanels('winver', 5).some(p => p.id === 'about'), 'winver is about on gnome 50');
assert(matchSettingsPanels('dnd', 5).some(p => p.id === 'notifications'), 'dnd is notifications');
assert(matchSettingsPanels('hotspot', 5).some(p => p.id === 'wifi'), 'hotspot is wifi');
assert(matchSettingsPanels('zoom', 5).some(p => p.id === 'universal-access'), 'zoom is accessibility');
assert(matchSettingsPanels('fractional scaling', 5).some(p => p.id === 'display'), 'fractional scaling is displays');
assert(readFileSync('prefs/aboutPage.js', 'utf8').includes('PowerToys'), 'about lists powertoys');
assert(readFileSync('prefs/aboutPage.js', 'utf8').includes('Synapse'), 'about lists synapse');
assert(readFileSync('prefs/aboutPage.js', 'utf8').includes('Onagre'), 'about lists onagre');
assert(readFileSync('prefs/featuresPage.js', 'utf8').includes('hwb(0 0% 0%)'), 'features mention hwb');
assert(metadata.description.includes('hwb(0 0% 0%)'), 'metadata mentions hwb');
assert(matchSettingsPanels('o', 20).some(p => p.id === 'online-accounts'), 'o prefixes online accounts');
assert(!matchSettingsPanels('o', 20).some(p => p.id === 'wifi'), 'o is not wifi');
assertEq(SETTINGS_PANELS.find(p => p.id === 'privacy').title, 'Privacy & Security', 'gnome 50 privacy title');
assert(SETTINGS_PANELS.every(p => p.icon), 'every settings panel has an icon');
assert(SETTINGS_PANELS.length >= 20, 'enough settings panels');
assertEq(settingsArgv('wifi', name => name === 'gnome-control-center')[1], 'wifi', 'prefer control center');
assertEq(settingsArgv('appearance', name => name === 'gnome-control-center')[1], 'background', 'appearance id remaps');
assertEq(settingsArgv('wifi', name => name === 'gio')[0], 'gio', 'gio launches panel desktop');
assertEq(settingsArgv('wifi', name => name === 'gio')[2], 'gnome-wifi-panel.desktop', 'panel desktop id');
assertEq(settingsArgv('wifi', name => name === 'gapplication')[0], 'gapplication', 'fallback launch settings');
assertEq(settingsArgv('wifi', () => null), null, 'no settings binary');

// selection wrap vs page clamp
assertEq(nextSelectedIndex(0, -1, 5), 4, 'arrow wrap up');
assertEq(nextSelectedIndex(4, 1, 5), 0, 'arrow wrap down');
assertEq(nextSelectedIndex(0, 5, 3), 2, 'page down clamps');
assertEq(nextSelectedIndex(2, -5, 3), 0, 'page up clamps');
assertEq(nextSelectedIndex(0, 1, 0), -1, 'empty list');

// search plan feature flags
const allOn = {
    prefixModes: true, url: true, path: true, places: true, bookmarks: true, apps: true, calculator: true,
    units: true, color: true, time: true, windows: true, system: true, settings: true, files: true,
    command: true, web: true,
};
assertEq(planSearch('=2+2', allOn).mode, 'calculator', 'plan calc prefix');
assertEq(planSearch('=2+2', allOn).providers.join(','), 'calculator', 'plan calc only');
assertEq(planSearch('@cats', allOn).providers.join(','), 'web', 'plan web prefix');
assertEq(planSearch('chrome', allOn).mode, 'all', 'plan all');
assert(planSearch('chrome', allOn).webFallback, 'web fallback armed');
assert(planSearch('chrome', allOn).providers.includes('apps'), 'apps in all');
assert(isActiveSearchQuery(' chrome '), 'typed query is active');
assert(!isActiveSearchQuery('   '), 'whitespace is not a typed query');
assertEq(planSearch('', allOn).providers.length, 0, 'empty all-mode runs nothing');
assertEq(planSearch('   ', allOn).webFallback, false, 'empty all-mode has no web');
assertEq(planSearch('$', allOn).providers.join(','), 'windows', 'empty windows prefix still lists windows');
assertEq(planSearch('#', allOn).providers.join(','), 'settings', 'empty settings prefix still lists panels');
const noCalc = Object.assign({}, allOn, {calculator: false});
assertEq(planSearch('=2+2', noCalc).providers.length, 0, 'disabled calc prefix');
const noPrefix = Object.assign({}, allOn, {prefixModes: false});
assertEq(planSearch('=2+2', noPrefix).mode, 'all', 'prefix disabled');
const appsOnly = {
    prefixModes: false, url: false, path: false, places: false, bookmarks: false, apps: true, calculator: false,
    units: false, color: false, time: false, windows: false, system: false, settings: false, files: false,
    command: false, web: false,
};
assertEq(planSearch('x', appsOnly).providers.join(','), 'apps', 'apps only');
assert(!planSearch('x', appsOnly).webFallback, 'web off');
const windowsFirst = Object.assign({}, allOn, {resultOrder: 'windows-first'});
assertEq(planSearch('term', windowsFirst).providers.indexOf('windows') <
    planSearch('term', windowsFirst).providers.indexOf('apps'), true, 'windows before apps');
assertEq(planSearch('term', allOn).providers.indexOf('apps') <
    planSearch('term', allOn).providers.indexOf('windows'), true, 'apps before windows');
assert(shouldRefreshRecentFiles(true, planSearch('. notes', allOn)), 'files prefix refreshes');
assert(!shouldRefreshRecentFiles(true, planSearch('=2+2', allOn)), 'calc prefix skips recent');
assert(!shouldRefreshRecentFiles(true, planSearch('@cats', allOn)), 'web prefix skips recent');
assert(shouldRefreshRecentFiles(true, planSearch('notes', allOn)), 'all-mode with files refreshes');
assert(!shouldRefreshRecentFiles(false, planSearch('notes', allOn)), 'disabled files skip');
assert(!shouldRefreshRecentFiles(true, planSearch('notes', appsOnly)), 'apps-only skips recent');
assert(shouldRefreshPath(true, planSearch('~/docs', allOn)), 'home path refreshes');
assert(shouldRefreshPath(true, planSearch('/tmp', allOn)), 'absolute path refreshes');
assert(!shouldRefreshPath(true, planSearch('chrome', allOn)), 'plain words skip path io');
assert(!shouldRefreshPath(false, planSearch('~/docs', allOn)), 'disabled path skips');
assert(shouldRefreshCommand(true, planSearch('! ls', allOn)), 'command prefix refreshes');
assert(!shouldRefreshCommand(false, planSearch('! ls', allOn)), 'disabled command skips');
assert(!shouldRefreshCommand(true, planSearch('ls', allOn)), 'plain words skip command io');
assert(shouldRefreshBookmarks(true, planSearch('docs', allOn)), 'all-mode bookmarks refresh');
assert(!shouldRefreshBookmarks(true, planSearch('=2+2', allOn)), 'calc prefix skips bookmarks');
assert(!shouldRefreshBookmarks(false, planSearch('docs', allOn)), 'disabled bookmarks skip');
assert(!shouldRefreshBookmarks(true, planSearch('docs', appsOnly)), 'apps-only skips bookmarks');
assert(planSearch('docs', allOn).providers.includes('bookmarks'), 'bookmarks planned');
assertEq(mergeEmptySuggestions('default', ['w'], ['a']).join(','), 'a,w', 'empty state apps first');
assertEq(mergeEmptySuggestions('windows-first', ['w'], ['a']).join(','), 'w,a', 'empty state windows first');
assert(planSearch('10 km to mi', allOn).providers.includes('units'), 'units planned');
assert(planSearch('documents', allOn).providers.includes('places'), 'places planned');
assert(planSearch('time', allOn).providers.includes('time'), 'time planned');
assert(!planSearch('10 km to mi', appsOnly).providers.includes('units'), 'units off');
assert(planSearch('~/docs', allOn).providers.includes('path'), 'home path is planned');
assert(planSearch('/tmp', allOn).providers.includes('path'), 'absolute path is planned');
assertEq(planSearch('~/docs', appsOnly).providers.join(','), 'apps', 'path off stays apps');

const flagSettings = {
    get_boolean(key) {
        return key !== 'enable-command-run';
    },
    get_string() {
        return 'windows-first';
    },
};
const fromSettings = flagsFromSettings(flagSettings);
assertEq(fromSettings.command, false, 'flags hide command runner');
assertEq(fromSettings.resultOrder, 'windows-first', 'flags read result order');
assert(fromSettings.apps, 'flags keep apps');
assert(fromSettings.path, 'flags keep path open');
assert(fromSettings.units, 'flags keep unit convert');
assert(fromSettings.places, 'flags keep places');
assert(fromSettings.bookmarks, 'flags keep bookmarks');
assert(fromSettings.time, 'flags keep time');
assert(fromSettings.color, 'flags keep color');

const providers = {
    apps: (query, max) => query === 'x' ? [{title: 'App', n: max}] : [],
    web: query => [{title: `web:${query}`}],
};
const planned = {providers: ['apps'], query: 'x', webFallback: true};
assertEq(collectSearchResults(planned, 4, providers, null)[0].title, 'App', 'provider hit');
assertEq(collectSearchResults(planned, 4, providers, null)[0].n, 4, 'max passed through');
assertEq(collectSearchResults({providers: ['apps'], query: 'z', webFallback: true}, 3, providers, null)[0].title, 'web:z', 'web fallback');
assertEq(collectSearchResults({providers: ['apps'], query: 'z', webFallback: false}, 3, providers, null).length, 0, 'web off');
assertEq(collectSearchResults({providers: ['missing'], query: 'x', webFallback: false}, 3, providers, null).length, 0, 'skip unknown provider');

const calcProviders = {
    calculator: (query, _max, _settings, mode) => {
        const n = evaluateArithmetic(query, mode === 'calculator');
        return n === null ? [] : [{title: String(n)}];
    },
};
assertEq(collectSearchResults(planSearch('=42', allOn), 1, calcProviders, null)[0].title, '42', 'prefix bare number');
assertEq(collectSearchResults(planSearch('42', allOn), 1, calcProviders, null).length, 0, 'bare number stays a search');

assert(shouldListWindow({}, false, 'normal', ['normal', 'dialog']), 'workspace listed');
assert(!shouldListWindow(null, false, 'normal', ['normal']), 'closed window skipped');
assert(!shouldListWindow({}, true, 'normal', ['normal']), 'skip taskbar skipped');
assert(!shouldListWindow({}, false, 'dock', ['normal', 'dialog']), 'dock skipped');
assert(windowMatches('Firefox', 'Navigator', 'fire'), 'title match');
assert(windowMatches('Notes', 'org.gnome.TextEditor', 'texted'), 'class match');
assert(windowMatches('Any', 'x', ''), 'empty query matches windows');
assert(!windowMatches('Firefox', 'Navigator', 'chrome'), 'window miss');
assert(windowMatches('Firefox', 'Navigator', 'workspace 2', 'Workspace 2'), 'workspace query');
assert(!windowMatches('Firefox', 'Navigator', 'workspace 2', 'Workspace 1'), 'other workspace');
assert(windowMatches('Notes', 'gedit', 'all workspaces', 'On all workspaces'), 'sticky query');
assert(!windowMatches('Firefox', 'Navigator', 'o', 'Workspace 1'), 'letter o is not every window');
assert(windowMatches('Firefox', 'Navigator', '2', 'Workspace 2'), 'digit matches workspace word');
assertEq(windowClassText('Firefox', 'Navigator', 'org.mozilla.firefox'), 'Firefox Navigator org.mozilla.firefox', 'class text');
const recency = sortWindowsMostRecent(
    [{id: 'old', t: 1}, {id: 'new', t: 9}, {id: 'mid', t: 4}],
    win => win.t,
);
assertEq(recency[0].id, 'new', 'most recent window first');
assertEq(recency[2].id, 'old', 'oldest window last');
assertEq(windowWorkspaceLabel(0), 'Workspace 1', 'first workspace is 1-based');
assertEq(windowWorkspaceLabel(2), 'Workspace 3', 'later workspace');
assertEq(windowWorkspaceLabel(-1), 'Switch to window', 'unknown workspace');
assertEq(windowWorkspaceLabel(1, true), 'On all workspaces', 'sticky window');
assertEq(parseWindowCloseQuery('close firefox').intent, 'close', 'close intent');
assertEq(parseWindowCloseQuery('close firefox').title, 'firefox', 'close title');
assertEq(parseWindowCloseQuery('KILL Chrome').intent, 'kill', 'kill intent');
assertEq(parseWindowCloseQuery('quit notes').intent, 'quit', 'quit intent');
assertEq(parseWindowCloseQuery('close'), null, 'close needs a title');
assertEq(parseWindowCloseQuery('firefox'), null, 'plain query is not close');
assertEq(windowCloseTitle('close', 'Firefox'), 'Close Firefox', 'close title text');
assertEq(windowCloseTitle('kill', 'Firefox'), 'Kill Firefox', 'kill title text');
assertEq(windowCloseTitle('quit', 'Notes'), 'Quit Notes', 'quit title text');
assert(shouldForceQuitWindow('kill'), 'kill force quits');
assert(!shouldForceQuitWindow('close'), 'close is polite');
assert(!shouldForceQuitWindow('quit'), 'quit is polite');
assert(!windowMatches('Firefox', 'Navigator', 'workspace', 'Workspace 1'), 'workspace alone is not every window');
assert(!windowMatches('Firefox', 'Navigator', 'spa', 'Workspace 1'), 'spa is not every window');
assert(!windowMatches('Firefox', 'Navigator', 'work', 'Workspace 1'), 'work is not every window');
assert(workspaceLabelMatches('Workspace 2', '2'), 'digit is workspace number');
assert(!workspaceLabelMatches('Workspace 2', 'workspace'), 'bare workspace is not a number');
assertEq(parseWorkspaceSwitchQuery('workspace 2').number, 2, 'switch workspace 2');
assertEq(parseWorkspaceSwitchQuery('switch to workspace 3').index, 2, 'switch to workspace');
assertEq(parseWorkspaceSwitchQuery('ws 1').number, 1, 'ws shorthand');
assertEq(parseWorkspaceSwitchQuery('workspace'), null, 'workspace needs a number');
assertEq(workspaceSwitchTitle(2), 'Switch to Workspace 2', 'switch title');
assert(workspaceIndexInRange(1, 3), 'index in range');
assert(!workspaceIndexInRange(3, 3), 'index at count is out');

const stored = {};
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('popos'));
assertEq(stored['popup-position'], 'top', 'popos sits at top');
assertEq(stored['show-result-numbers'], true, 'popos has number hints');
assertEq(stored['result-order'], 'windows-first', 'popos windows first');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('krunner'));
assertEq(stored['row-density'], 'compact', 'krunner is compact');
assertEq(stored['popup-position'], 'top', 'krunner sits at top');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('rofi'));
assertEq(stored['row-density'], 'compact', 'rofi is compact');
assertEq(stored['show-section-headers'], false, 'rofi hides headers');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('raycast'));
assertEq(stored['show-section-headers'], false, 'raycast hides headers');
assertEq(stored['popup-position'], 'center', 'raycast is centered');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('albert'));
assertEq(stored['show-section-headers'], true, 'albert keeps headers');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('wofi'));
assertEq(stored['row-density'], 'compact', 'wofi is compact');
assertEq(stored['show-section-headers'], false, 'wofi hides headers');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('fuzzel'));
assertEq(stored['row-density'], 'compact', 'fuzzel is compact');
assertEq(stored['show-section-headers'], false, 'fuzzel hides headers');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('anyrun'));
assertEq(stored['show-section-headers'], false, 'anyrun hides headers');
assertEq(stored['popup-position'], 'center', 'anyrun is centered');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('tofi'));
assertEq(stored['row-density'], 'compact', 'tofi is compact');
assertEq(stored['popup-position'], 'top', 'tofi sits at top');
assertEq(stored['show-section-headers'], false, 'tofi hides headers');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('light'));
assertEq(stored['popup-position'], 'center', 'light is centered');
assertEq(stored['show-section-headers'], true, 'light keeps headers');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('powertoys'));
assertEq(stored['show-section-headers'], false, 'powertoys hides headers');
assertEq(stored['popup-position'], 'center', 'powertoys is centered');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('synapse'));
assertEq(stored['show-section-headers'], false, 'synapse hides headers');
assertEq(iconSizeForLook(getTheme('synapse').look, 'comfortable') >
    iconSizeForLook(getTheme('powertoys').look, 'comfortable'), true, 'synapse icons larger than powertoys');
assertEq(iconSizeForLook(getTheme('raycast').look, 'comfortable') >
    iconSizeForLook(getTheme('albert').look, 'comfortable'), true, 'raycast icons larger than albert');

for (const theme of THEMES)
    assert(theme.look && theme.look.position && theme.look.resultOrder && theme.look.iconSize, `look profile ${theme.id}`);

assert(iconSizeForLook(getTheme('popos').look, 'comfortable') > iconSizeForLook(getTheme('krunner').look, 'comfortable'), 'popos icons larger than krunner');
assert(iconSizeForLook(getTheme('popos').look, 'compact') > iconSizeForLook(getTheme('krunner').look, 'compact'), 'compact still keeps look icon scale');
assertEq(iconSizeForLook({iconSize: 40}, 'compact'), 32, 'compact is 80 percent');
assertEq(iconSizeForLook({iconSize: 28}, 'comfortable'), 28, 'comfortable keeps size');
assertEq(stored['icon-size'], 48, 'synapse look writes icon size');
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
        stored[key] = value;
    },
    set_int(key, value) {
        stored[key] = value;
    },
}, getTheme('onagre'));
assertEq(stored['popup-position'], 'center', 'onagre is centered');
assertEq(stored['show-section-headers'], false, 'onagre hides headers');
assertEq(stored['icon-size'], 30, 'onagre look writes icon size');
assert(shouldApplyLook('spotlight', 'onagre'), 'changing look applies chrome');
assert(!shouldApplyLook('onagre', 'onagre'), 'same look does not reset chrome');
assert(!shouldApplyLook('onagre', ''), 'empty look is ignored');

// every get_* key in js exists in the schema
const settingKeys = new Set();
for (const match of schema.matchAll(/<key name="([^"]+)"/g))
    settingKeys.add(match[1]);
const jsFiles = [
    ...readdirSync('.').filter(f => f.endsWith('.js')),
    ...readdirSync('prefs').map(f => `prefs/${f}`),
];
const usedKeys = new Set();
for (const file of jsFiles) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/get_(?:boolean|int|string|strv)\('([^']+)'\)/g))
        usedKeys.add(match[1]);
    for (const match of text.matchAll(/bind\('([^']+)'/g))
        usedKeys.add(match[1]);
    for (const match of text.matchAll(/set_(?:boolean|int|string|strv)\('([^']+)'/g))
        usedKeys.add(match[1]);
}
for (const key of usedKeys)
    assert(settingKeys.has(key), `schema has used key ${key}`);

// css defines every theme
const css = readFileSync('stylesheet.css', 'utf8');
for (const id of themeIds)
    assert(css.includes(`.gosh-theme-${id}`), `css theme ${id}`);
assert(css.includes('.gosh-container'), 'base container class');
assert(css.includes('.gosh-selected'), 'selected class');
assert(css.includes('.gosh-container.gosh-density-compact'), 'compact beats theme padding');
assert(
    css.lastIndexOf('.gosh-container.gosh-density-compact .gosh-result') >
        Math.max(...themeIds.map(id => css.lastIndexOf(`.gosh-theme-${id} .gosh-result`))),
    'compact rules come after theme padding',
);
assert(css.includes('background-color: #000000'), 'tofi black bar');
assert(css.includes('background-color: #fdf6e3'), 'fuzzel solarized card');
assert(css.includes('background-color: #1e1e2e'), 'anyrun mocha card');
assert(css.includes('border-left: 3px solid #89b4fa'), 'anyrun selected edge');
assert(css.includes('border-left: 3px solid #7aa2f7'), 'omarchy walker selected edge');
assert(css.includes('caret-color: #ff6363'), 'raycast red caret');
assert(css.includes('background-color: #1d99f3'), 'albert selected row');
assert(css.includes('background-color: #285577'), 'wofi selected row');
assert(css.includes('background-color: #f6f5f4'), 'light card');
assert(css.includes('background-color: #2c2c2c'), 'powertoys card');
assert(css.includes('background-color: #3c3b37'), 'synapse card');
assert(css.includes('caret-color: #60cdff'), 'powertoys caret');
assert(css.includes('caret-color: #f07746'), 'synapse caret');
assert(!css.includes('.spotlight-'), 'no leftover spotlight classes');
for (const id of ['omarchy', 'popos', 'ulauncher', 'gnome', 'raycast', 'fuzzel', 'anyrun', 'powertoys', 'synapse']) {
    assert(
        css.includes(`.gosh-theme-${id} .gosh-result.gosh-selected .gosh-result-description`),
        `selected description ${id}`,
    );
}
assert(css.includes('.gosh-theme-fuzzel .gosh-result.gosh-selected .gosh-result-description'), 'fuzzel selected stays dark');

// scrollview helpers speak both the 45 and 48 apis
const modernScroll = {
    set_child(child) {
        this.child = child;
    },
    set_policy(h, v) {
        this.h = h;
        this.v = v;
    },
    get_vadjustment() {
        return {kind: 'adj'};
    },
};
attachScrollChild(modernScroll, 'box');
assertEq(modernScroll.child, 'box', '48 set_child');
applyScrollPolicy(modernScroll, 0, 1);
assertEq(modernScroll.v, 1, '48 set_policy');
assertEq(getVerticalAdjustment(modernScroll).kind, 'adj', '48 vadjustment');

const legacyScroll = {
    add_child(child) {
        this.child = child;
    },
    get_vscroll_bar() {
        return {
            get_adjustment() {
                return {kind: 'bar'};
            },
        };
    },
};
attachScrollChild(legacyScroll, 'box');
assertEq(legacyScroll.child, 'box', '45 add_child fallback');
applyScrollPolicy(legacyScroll, 2, 3);
assertEq(legacyScroll.vscrollbar_policy, 3, '45 policy props');
assertEq(getVerticalAdjustment(legacyScroll).kind, 'bar', '45 scrollbar adj');

const xbel = `
<xbel>
  <bookmark href="file:///tmp/notes.txt"/>
  <bookmark href="https://example.com"/>
  <bookmark href="file:///tmp/notes.txt"/>
  <bookmark href="file:///home/user/My%20File.pdf"/>
</xbel>`;
assertEq(parseRecentXbel(xbel).length, 2, 'xbel file hrefs only and unique');
assertEq(parseRecentXbel(xbel)[1], 'file:///home/user/My%20File.pdf', 'keep encoded uri');
assertEq(basenameFromUri('file:///home/user/My%20File.pdf'), 'My File.pdf', 'unescape basename');
assertEq(basenameFromUri('file:///tmp/a%'), 'a%', 'lone percent stays');
assertEq(pathFromFileUri('file:///home/user/My%20File.pdf'), '/home/user/My File.pdf', 'file uri path');
assertEq(parentPathFromFileUri('file:///home/user/My%20File.pdf'), '/home/user', 'file uri parent');
assertEq(parentPathFromFileUri('file:///tmp/a'), '/tmp', 'rootish parent');
assertEq(parentPathFromFileUri('file:///foo'), '/', 'root parent');
assertEq(parentPathFromFileUri('https://example.com/a'), '', 'http has no file parent');
assertEq(collapseHomePath('/home/u/docs', '/home/u'), '~/docs', 'collapse home');
assertEq(collapseHomePath('/home/u', '/home/u'), '~', 'collapse home itself');
assertEq(collapseHomePath('/tmp', '/home/u'), '/tmp', 'leave foreign path');
assert(recentFileMatches('notes.txt', '~/Documents', 'docu'), 'folder search');
assert(recentFileMatches('notes.txt', '~/Documents', 'notes'), 'name search');
assert(!recentFileMatches('notes.txt', '~/Documents', 'chrome'), 'recent miss');
assert(!recentFileMatches('notes.txt', '~/Documents', 'o'), 'letter o is not a recent file');
assertEq(iconForBasename('notes.pdf'), 'x-office-document-symbolic', 'pdf icon');
assertEq(iconForBasename('shot.png'), 'image-x-generic-symbolic', 'image icon');
assertEq(iconForBasename('song.mp3'), 'audio-x-generic-symbolic', 'audio icon');
assertEq(iconForBasename('README'), 'document-open-recent-symbolic', 'no extension');
assertEq(iconForBasename('.bashrc'), 'document-open-recent-symbolic', 'dotfile');
assertEq(RECENT_EXISTS_BUDGET_MS, 800, 'exists budget');
assert(recentExistsShouldSettle(0, 10, 800), 'all exists checks done');
assert(!recentExistsShouldSettle(2, 100, 800), 'still waiting');
assert(recentExistsShouldSettle(2, 800, 800), 'budget elapsed');
assertEq(readPreedit('あ'), 'あ', 'string preedit');
assertEq(readPreedit(['漢', null, 1]), '漢', 'tuple preedit');
assertEq(readPreedit(null), '', 'missing preedit');
assert(shouldPropagateForPreedit('あ'), 'ime composing');
assert(!shouldPropagateForPreedit(''), 'no preedit');
assertEq(parseRecentXbel('').length, 0, 'empty xbel');
assertEq(
    parseRecentXbel('<bookmark href="file:///tmp/a&amp;b.txt"/>')[0],
    'file:///tmp/a&b.txt',
    'xbel unescapes amp',
);
assertEq(
    parseRecentXbel("<bookmark href='file:///tmp/single.txt'/>")[0],
    'file:///tmp/single.txt',
    'xbel single-quoted href',
);
assertEq(
    parseRecentXbel('<bookmark href = "file:///tmp/spaced.txt"/>')[0],
    'file:///tmp/spaced.txt',
    'xbel href with spaces around equals',
);

assertEq(resolveKeyAction('Tab', false, false, false).delta, 1, 'tab down');
assertEq(resolveKeyAction('Tab', true, false, false).delta, -1, 'shift tab up');
assertEq(resolveKeyAction('ISO_Left_Tab', false, false, false).delta, -1, 'iso left tab');
assertEq(resolveKeyAction('Escape', false, false, false).type, 'close', 'escape');
assertEq(resolveKeyAction('Home', false, false, false).type, 'propagate', 'home is caret unless at edge');
assertEq(resolveKeyAction('End', false, false, false).type, 'propagate', 'end is caret unless at edge');
assertEq(resolveHomeEndAction('Home', 3, 8).type, 'propagate', 'home mid query moves caret');
assertEq(resolveHomeEndAction('Home', 0, 8).delta, -999, 'home at start jumps to first');
assertEq(resolveHomeEndAction('End', 2, 8).type, 'propagate', 'end mid query moves caret');
assertEq(resolveHomeEndAction('End', -1, 8).delta, 999, 'end at end jumps to last');
assertEq(resolveHomeEndAction('End', 8, 8).delta, 999, 'end at length jumps to last');
assertEq(resolveHomeEndAction('Home', 0, 0).delta, -999, 'empty home jumps');
assertEq(nextSelectedIndex(3, -999, 6), 0, 'home clamps to first');
assertEq(nextSelectedIndex(1, 999, 6), 5, 'end clamps to last');
assertEq(resolveKeyAction('3', false, true, true).index, 2, 'alt 3');
assertEq(resolveKeyAction('3', false, true, false).type, 'propagate', 'alt 3 without hints');
assertEq(resolveKeyAction('a', false, false, false).type, 'propagate', 'letters propagate');
assertEq(resolveCtrlNav('j').delta, 1, 'ctrl j down');
assertEq(resolveCtrlNav('k').delta, -1, 'ctrl k up');
assertEq(resolveCtrlNav('n').delta, 1, 'ctrl n down');
assertEq(resolveCtrlNav('p').delta, -1, 'ctrl p up');
assertEq(resolveCtrlNav('J').delta, 1, 'ctrl J down');
assertEq(resolveCtrlNav('a'), null, 'ctrl a is not nav');
assert(!shouldOfferApp(true, false, true), 'hide apps until parental init');
assert(shouldOfferApp(true, true, true), 'show after parental init');
assert(!shouldOfferApp(false, true, true), 'hidden desktop files stay hidden');
assert(activateResultSafe({activate: () => {}}), 'activate ok');
assert(!activateResultSafe({activate: () => {
    throw new Error('gone');
}}), 'activate error is swallowed');

assertEq(firstCommandArg([]), '', 'empty argv');
assertEq(firstCommandArg(['ls', '-la']), 'ls', 'first arg');
assert(commandUsesPathLookup('ls'), 'bare name uses PATH');
assert(!commandUsesPathLookup('/bin/ls'), 'absolute skips PATH');
assert(!commandUsesPathLookup('./tool'), 'relative slash skips PATH');
assert(commandIsReady('ls', name => name === 'ls' ? '/bin/ls' : null, () => false), 'path lookup hit');
assert(!commandIsReady('nope', () => null, () => false), 'missing on PATH');
assert(commandIsReady('/bin/ls', () => null, path => path === '/bin/ls'), 'absolute exists');
assert(!commandIsReady('/no/such', () => '/bin/true', () => false), 'absolute missing');
assert(isPathQuery('~/docs'), 'tilde path');
assert(isPathQuery('/tmp/foo'), 'absolute path');
assert(isPathQuery('./run'), 'dot slash path');
assert(isPathQuery('.'), 'dot alone is home');
assert(!isPathQuery('.bashrc'), 'dotfile is not a path');
assert(!isPathQuery('chrome'), 'plain word is not a path');
assertEq(expandHomePath('~/bin/x', '/home/u'), '/home/u/bin/x', 'expand tilde');
assertEq(expandHomePath('./run', '/home/u'), '/home/u/run', 'expand dot slash');
assertEq(expandHomePath('.', '/home/u'), '/home/u', 'dot is home');
assertEq(expandHomePath('~', '/home/u'), '/home/u', 'tilde is home');
assertEq(expandHomePath('/usr/bin/ls', '/home/u'), '/usr/bin/ls', 'absolute stays');
assertEq(expandHomePath('ls', '/home/u'), 'ls', 'bare name stays');
assertEq(expandHomePath('~/../etc', '/home/u'), '/home/etc', 'tilde parent normalizes');
assertEq(normalizeAbsolute('/home/u/../x/./y'), '/home/x/y', 'normalize dots');
assertEq(fileUriFromAbsolute('/home/a b/c'), 'file:///home/a%20b/c', 'file uri encodes');
assertEq(expandHomeArgv(['./tool', '~/out'], '/home/u').join(','), '/home/u/tool,/home/u/out', 'argv expands');
assertEq(pathRowMeta('~/nope', '/home/u/nope', 'missing').description, 'Path not found', 'missing path');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'directory').icon, 'folder-symbolic', 'dir icon');
assertEq(pathRowMeta('/tmp/a.pdf', '/tmp/a.pdf', 'file').icon, 'x-office-document-symbolic', 'file icon');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'directory', '/home/u').title, '~/docs', 'path title collapses home');
assertEq(terminalSpec(name => name === 'xdg-terminal-exec').argv[0], 'xdg-terminal-exec', 'prefer xdg-terminal-exec');
assert(terminalCommand(name => name === 'ptyxis', '/tmp/docs').argv.includes('--working-directory=/tmp/docs'), 'ptyxis working dir');
assertEq(terminalCommand(name => name === 'xdg-terminal-exec', '/tmp/docs').cwd, '/tmp/docs', 'xdg-terminal-exec uses cwd');
assertEq(terminalCommand(() => null, '/tmp/docs'), null, 'no terminal');
assertEq(terminalRowMeta('/home/u/docs', '/home/u', 'place').description, '~/docs', 'terminal path collapses');
assertEq(terminalRowMeta('/tmp/docs', '', 'path').title, 'Open in Terminal', 'terminal title');
assert(PLACE_CATALOG.length >= 8, 'xdg places');
assert(placeMatches('Downloads', ['downloads'], 'down'), 'place prefix');
assert(matchPlaces('docs').some(p => p.id === 'documents'), 'docs is documents');
assert(matchPlaces('chrome').length === 0, 'place miss');
assert(matchPlaces('o').length === 0, 'letter o is not every folder');
assert(matchPlaces('~').some(p => p.id === 'home'), 'tilde is home');
assert(matchPlaces('d').some(p => p.id === 'desktop'), 'd is a folder prefix');
const collapsed = takeUniquePlaces(PLACE_CATALOG, id => id === 'home' ? '/home/u' : '/home/u', 9);
assertEq(collapsed.length, 1, 'duplicate xdg paths collapse');
assertEq(collapsed[0].place.id, 'home', 'home wins first unique path');
assert(!placeMatches('Home', ['home'], ''), 'empty query no place');
assertEq(hostFromUri('sftp://me@nas.local/share'), 'nas.local', 'bookmark host');
assertEq(bookmarkTitle('file:///home/u/Projects', ''), 'Projects', 'bookmark basename');
assertEq(bookmarkTitle('file:///home/u/Projects', 'Code'), 'Code', 'bookmark label');
assertEq(bookmarkDescription('file:///home/u/Projects', '/home/u'), '~/Projects', 'bookmark home collapse');
assertEq(bookmarkIcon('file:///tmp'), 'folder-symbolic', 'file bookmark icon');
assertEq(bookmarkIcon('sftp://nas/share'), 'network-server-symbolic', 'remote bookmark icon');
const parsedMarks = parseGtkBookmarks('file:///home/u/Code Code\nfile:///home/u/Code\nsftp://nas/share NAS\n# comment\n\n');
assertEq(parsedMarks.length, 2, 'duplicate bookmark uri dropped');
assertEq(parsedMarks[0].title, 'Code', 'first bookmark keeps label');
assertEq(parsedMarks[1].title, 'NAS', 'remote bookmark label');
assertEq(mergeBookmarkFiles(['file:///a A', 'file:///a B\nfile:///b B']).length, 2, 'merge unique uris');
assert(bookmarkMatches('Code', '~/Projects', 'cod'), 'bookmark title prefix');
assert(bookmarkMatches('Notes', '~/Documents', 'doc'), 'bookmark folder match');
assert(!bookmarkMatches('Code', '~/Projects', 'o'), 'letter o is not a bookmark');
assertEq(matchBookmarks([{title: 'Code', description: '~/x'}, {title: 'Zed', description: '~/z'}], 'z', 2).length, 1, 'bookmark filter');
assertEq(matchSettingsPanels('', 5).length, 5, 'empty settings query lists panels');
assertEq(timeQueryKind('time'), 'time', 'time query');
assertEq(timeQueryKind('NOW'), 'time', 'now query');
assertEq(timeQueryKind('today'), 'date', 'today query');
assertEq(timeQueryKind('clock'), 'time', 'clock query is time');
assertEq(timeQueryKind('timeout'), null, 'timeout is not time');
assertEq(timeQueryKind('tomorrow'), 'tomorrow', 'tomorrow query');
assertEq(formatClock(9, 5, 3), '09:05:03', 'clock pad');
assertEq(formatDateTitle('Monday', 3, 'August', 2026), 'Monday, 3 August 2026', 'date title');
assertEq(weekdayName(1), 'Monday', 'glib monday');
assertEq(weekdayName(7), 'Sunday', 'glib sunday');
assertEq(monthName(8), 'August', 'august');
assertEq(formatIsoDate(2026, 8, 3), '2026-08-03', 'iso date');
assertEq(normalizeHexColor('#f00'), '#ff0000', 'short hex');
assertEq(normalizeHexColor('#AABBCC'), '#aabbcc', 'long hex');
assertEq(normalizeHexColor('#f00f'), '#ff0000', 'four digit hex drops alpha');
assertEq(normalizeHexColor('#ff000080'), '#ff0000', 'eight digit hex drops alpha');
assertEq(normalizeHexColor('ff0000'), null, 'hash required');
assertEq(normalizeHexColor('cafe'), null, 'word is not a color');
assertEq(normalizeRgbColor('rgb(255, 0, 0)'), '#ff0000', 'rgb color');
assertEq(normalizeRgbColor('rgb(255 0 0)'), '#ff0000', 'modern rgb');
assertEq(normalizeRgbColor('rgb(255 0 0 / 40%)'), '#ff0000', 'modern rgb slash alpha');
assertEq(normalizeRgbColor('rgba(0,128,255,0.5)'), '#0080ff', 'rgba ignores alpha');
assertEq(normalizeRgbColor('rgb(256, 0, 0)'), null, 'rgb out of range');
assertEq(normalizeColor('#f00'), '#ff0000', 'color helper hex');
assertEq(normalizeColor('rgb(1, 2, 3)'), '#010203', 'color helper rgb');
assertEq(normalizeHslColor('hsl(0, 100%, 50%)'), '#ff0000', 'hsl red');
assertEq(normalizeHslColor('hsl(0 100% 50%)'), '#ff0000', 'modern hsl');
assertEq(normalizeHslColor('hsl(0deg 100% 50%)'), '#ff0000', 'modern hsl deg');
assertEq(normalizeHslColor('hsl(0deg, 100%, 50%)'), '#ff0000', 'comma hsl deg');
assertEq(normalizeHslColor('hsl(0 100% 50% / 0.4)'), '#ff0000', 'modern hsl slash alpha');
assertEq(normalizeColor('hsla(120, 100%, 50%, 0.4)'), '#00ff00', 'hsla green');
assertEq(normalizeHslColor('hsl(0, 200%, 50%)'), null, 'hsl sat range');
assertEq(normalizeHwbColor('hwb(0 0% 0%)'), '#ff0000', 'hwb red');
assertEq(normalizeHwbColor('hwb(0deg, 0%, 0%)'), '#ff0000', 'comma hwb deg');
assertEq(normalizeHwbColor('hwb(0deg 0% 0%)'), '#ff0000', 'modern hwb deg');
assertEq(normalizeHwbColor('hwb(120 0% 0%)'), '#00ff00', 'hwb green');
assertEq(normalizeHwbColor('hwb(0 100% 0%)'), '#ffffff', 'hwb white');
assertEq(normalizeHwbColor('hwb(0 0% 100%)'), '#000000', 'hwb black');
assertEq(normalizeHwbColor('hwb(0 50% 50%)'), '#808080', 'hwb gray');
assertEq(normalizeHwbColor('hwb(0 20% 20%)'), '#cc3333', 'hwb tint shade');
assertEq(normalizeHwbColor('hwb(0 0% 0% / 0.4)'), '#ff0000', 'hwb slash alpha');
assertEq(normalizeColor('hwba(240, 0%, 0%, 0.4)'), '#0000ff', 'hwba blue');
assertEq(normalizeHwbColor('hwb(0 200% 0%)'), null, 'hwb white range');
assert(planSearch('#ff0000', allOn).providers.includes('color'), 'color planned');
const keepRows = [
    {type: 'app', title: 'Firefox', description: 'Web Browser'},
    {type: 'window', title: 'Firefox', description: 'Workspace 2'},
    {type: 'file', title: 'notes.txt', description: '~/Documents'},
];
assertEq(paintSelectionIndex(null, keepRows), 0, 'first paint selects top');
assertEq(paintSelectionIndex({type: 'window', title: 'Firefox', description: 'Workspace 2', index: 1}, keepRows), 1, 'same title keeps type');
assertEq(paintSelectionIndex({type: 'file', title: 'gone.txt', description: '~', index: 2}, keepRows), 2, 'missing row clamps index');
assertEq(paintSelectionIndex({type: 'file', title: 'gone.txt', index: 9}, keepRows), 0, 'stale index falls back');
assertEq(paintSelectionIndex({type: 'app', title: 'Firefox'}, []), -1, 'empty list has no selection');
assert(commandIsReady(expandHomePath('./ls', '/bin'), () => null, path => path === '/bin/ls'), 'home-relative ready');
assertEq(commandRowMeta('ls', true).description, 'Run command', 'ready command copy');
assertEq(commandRowMeta('nope', false).description, 'Command not found', 'missing command copy');

assertEq(normalizeAccelKey('A'), 'a', 'letter keys lowercased');
assertEq(normalizeAccelKey('space'), 'space', 'named keys stay');
assertEq(buildAccelerator('space', {
    super: false, control: true, shift: false, alt: false, meta: false,
}), '<Control>space', 'ctrl space');
assertEq(buildAccelerator('space', {
    super: true, control: false, shift: false, alt: false, meta: true,
}), '<Super>space', 'super does not also write meta');
assertEq(buildAccelerator('A', {
    super: false, control: true, shift: true, alt: false, meta: false,
}), '<Control><Shift>a', 'ctrl shift letter');
assertEq(formatAccelerator('<Control>space'), 'Ctrl+space', 'format ctrl space');
assertEq(formatAccelerator('<Super><Shift>a'), 'Super+Shift+a', 'format super shift');
assertEq(formatShortcutList([]), '', 'empty shortcut list');
assertEq(formatShortcutList(['<Alt>space']), 'Alt+space', 'format list');
const mods = modifiersFromMask(0b101, {super: 1, control: 4, shift: 2, alt: 8, meta: 16});
assert(mods.super && mods.control && !mods.shift, 'mask bits');
assert(isModifierKeyName('Meta_L'), 'meta is a modifier');
assert(isModifierKeyName('ISO_Level3_Shift'), 'altgr is a modifier');
assert(!isModifierKeyName('space'), 'space is not a modifier');
assert(isNavAction('move'), 'move is nav');
assert(!isNavAction('propagate'), 'propagate is not nav');

// rename leftovers in source
assertEq(metadata.uuid.includes('spotlight'), false, 'uuid is not spotlight');
assert(schema.includes('org.gnome.shell.extensions.gosh-is-launcher'), 'schema id');

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0)
    process.exit(1);
