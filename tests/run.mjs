import {evaluateArithmetic, formatNumber, normalizeMath, formatHex, calculatorDescription} from '../calculator.js';
import {parseUnitQuery, convertUnits, convertQuery, formatUnitValue, normalizeUnitQuery} from '../unitMatch.js';
import {isNewWindowAction, newWindowTitle, desktopActionTitle, takeAppActions, actionResultLimit} from '../appAction.js';
import {parseQuery, PREFIXES, isPrefixToken} from '../prefixParser.js';
import {isUrlQuery, normalizeUrl, hostOfQuery, schemeForHost, isPlausibleWebHost, isDottedIpv4, urlRowDescription, urlRowIcon, isUnsafeLaunchUri} from '../urlMatch.js';
import {canOpenPopup, shouldCloseOnToggle, shouldCloseOnSession, sessionLimitsReached, timeLimitsState, TIME_LIMITS_REACHED} from '../popupGate.js';
import {popupOrigin, popupWidthForWorkArea, resultsMaxHeightForWorkArea, liftOriginForResults, placePopup, MIN_RESULTS_HEIGHT} from '../popupPosition.js';
import {backdropBox, backdropPointerAction} from '../backdropBox.js';
import {THEMES, getTheme, getThemeIds, applyLookSettings, iconSizeForLook, shouldApplyLook} from '../themes.js';
import {SEARCH_ENGINES, getEngine} from '../webEngines.js';
import {getSectionTitle, getSectionTypes} from '../sectionTitles.js';
import {actionMatchesQuery, normalizeActionQuery, actionTitle, actionIcon, liveActionName, liveActionIcon} from '../actionMatch.js';
import {planSearch, flagsFromSettings, isActiveSearchQuery, shouldRefreshRecentFiles, shouldRefreshPath, shouldRefreshCommand, shouldRefreshBookmarks, mergeEmptySuggestions, stripLeadingVerb} from '../searchPlan.js';
import {wordPrefixMatch, textMatchesQuery, SUBSTRING_MIN} from '../wordMatch.js';
import {appMatchTier, appBaseName, takeUniqueByBaseName, appRowDescription} from '../appMatch.js';
import {rowPointerAction, rowTouchPhase, PRIMARY_BUTTON} from '../resultPointer.js';
import {matchSettingsPanels, SETTINGS_PANELS, settingsArgv, settingsPanelAvailable, settingsPanelDesktop, settingsResultMeta} from '../settingsPanels.js';
import {nextSelectedIndex} from '../selectionMath.js';
import {attachScrollChild, applyScrollPolicy, getVerticalAdjustment} from '../scrollView.js';
import {parseRecentXbel, basenameFromUri, iconForBasename, recentExistsShouldSettle, RECENT_EXISTS_BUDGET_MS, pathFromFileUri, parentPathFromFileUri, remoteHostFromUri, recentFileMatches} from '../recentXbel.js';
import {readPreedit, shouldPropagateForPreedit} from '../entryPreedit.js';
import {resolveKeyAction, resolveHomeEndAction, resolveCtrlNav, isNavAction} from '../keyAction.js';
import {shouldOfferApp, hasParentalGiveUp, markParentalGiveUp, resetParentalGiveUp, PARENTAL_GIVE_UP_MS} from '../appReady.js';
import {activateResultSafe, resultCanActivate, activatableResult} from '../resultActivate.js';
import {firstCommandArg, commandUsesPathLookup, commandIsReady, commandFileIsReady, commandRowMeta} from '../commandReady.js';
import {extraPathDirs, findUserProgram, joinPathDirs} from '../userPath.js';
import {isPathQuery, expandHomePath, expandHomeArgv, resolveSpawnPath, resolveCommandArgv, normalizeAbsolute, fileUriFromAbsolute, collapseHomePath} from '../homePath.js';
import {pathRowMeta} from '../pathMatch.js';
import {terminalSpec, terminalCommand, terminalRowMeta} from '../terminalLaunch.js';
import {placeMatches, matchPlaces, PLACE_CATALOG, takeUniquePlaces} from '../placeMatch.js';
import {parseGtkBookmarks, mergeBookmarkFiles, bookmarkTitle, bookmarkDescription, bookmarkMatches, matchBookmarks, bookmarkIcon, hostFromUri, normalizeBookmarkUri} from '../bookmarkParse.js';
import {timeQueryKind, normalizeTimeQuery, dateOffsetDays, formatClock, formatDateTitle, weekdayName, monthName, formatIsoDate} from '../timeMatch.js';
import {normalizeHexColor, normalizeRgbColor, normalizeHslColor, normalizeHwbColor, normalizeColor, normalizeNamedColor} from '../colorMatch.js';
import {paintSelectionIndex, firstSelectableIndex, resultSelectionKey} from '../paintSelection.js';
import {buildAccelerator, modifiersFromMask, normalizeAccelKey, formatAccelerator, formatShortcutList, isModifierKeyName, shortcutAttempts} from '../shortcutAccel.js';
import {collectSearchResults} from '../searchRun.js';
import {windowMatches, windowClassText, shouldListWindow, sortWindowsMostRecent, windowWorkspaceLabel, workspaceLabelMatches, windowRecencyValue, windowResultId} from '../windowMatch.js';
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
assertEq(evaluateArithmetic('-2^2'), -4, 'unary minus is outside power');
assertEq(evaluateArithmetic('(-2)^2'), 4, 'grouped unary stays in the base');
assertEq(evaluateArithmetic('2^-2'), 0.25, 'negative exponent');
assertEq(evaluateArithmetic('tan(90)'), null, 'tan 90 is undefined');
assertEq(evaluateArithmetic('0x'), null, 'incomplete hex is not math');
assertEq(evaluateArithmetic('2foo'), null, 'junk ident is not implicit multiply');
assertEq(evaluateArithmetic('.5+1'), 1.5, 'leading decimal');
assertEq(evaluateArithmetic('.5*2', true), 1, 'bare leading decimal');
assertEq(evaluateArithmetic('1e'), null, 'incomplete scientific stays a search');
assertEq(evaluateArithmetic('2*e'), 2 * Math.E, 'explicit euler still works');
assertEq(evaluateArithmetic('2π'), 2 * Math.PI, 'unicode pi');
assertEq(evaluateArithmetic('5²'), 25, 'unicode square');
assertEq(evaluateArithmetic('2³'), 8, 'unicode cube');
assertEq(evaluateArithmetic('sin(90°)'), 1, 'degree symbol');
assertEq(evaluateArithmetic('sin 90'), 1, 'bare sin');
assertEq(evaluateArithmetic('sqrt 16'), 4, 'bare sqrt');
assertEq(evaluateArithmetic('log2 8'), 3, 'bare log2');
assertEq(evaluateArithmetic('sin 90 + 1'), 2, 'bare sin then add');
assertEq(evaluateArithmetic('sin90'), null, 'sin90 stays one ident');
assertEq(evaluateArithmetic('2 plus 2'), 4, 'spoken plus');
assertEq(evaluateArithmetic('half of 80'), 40, 'half of');
assertEq(evaluateArithmetic('square root of 16'), 4, 'square root of');
assertEq(evaluateArithmetic('three thousand + 1'), 3001, 'three thousand');
assertEq(evaluateArithmetic('twenty plus two'), 22, 'twenty plus two');
assertEq(evaluateArithmetic('forty-five + 1'), 46, 'forty-five');
assertEq(evaluateArithmetic('twenty one + 1'), 22, 'twenty one');
assertEq(evaluateArithmetic('one hundred + 1'), 101, 'one hundred');
assertEq(evaluateArithmetic('a hundred + 1'), 101, 'a hundred');
assertEq(evaluateArithmetic('a thousand + 1'), 1001, 'a thousand');
assertEq(evaluateArithmetic('one hundred and twenty + 1'), 121, 'one hundred and twenty');
assertEq(evaluateArithmetic('one hundred and twenty-one + 1'), 122, 'one hundred and twenty-one');
assertEq(evaluateArithmetic('twenty thousand + 1'), 20001, 'twenty thousand');
assertEq(evaluateArithmetic('2 add 3'), 5, 'spoken add');
assertEq(evaluateArithmetic('8 subtract 3'), 5, 'spoken subtract');
assertEq(evaluateArithmetic('address'), null, 'address is not add');
assertEq(evaluateArithmetic('10 minus 3'), 7, 'spoken minus');
assertEq(evaluateArithmetic('4 times 5'), 20, 'spoken times');
assertEq(evaluateArithmetic('3 multiplied by 3'), 9, 'spoken multiplied');
assertEq(evaluateArithmetic('8 divided by 2'), 4, 'spoken divide');
assertEq(evaluateArithmetic('8 over 2'), 4, 'spoken over');
assertEq(evaluateArithmetic('5 squared'), 25, 'spoken squared');
assertEq(evaluateArithmetic('2 cubed'), 8, 'spoken cubed');
assertEq(evaluateArithmetic('2 to the power of 8'), 256, 'spoken power');
assertEq(evaluateArithmetic('2 to the 8th'), 256, 'spoken ordinal power');
assertEq(evaluateArithmetic('2 to the 8th power'), 256, 'spoken nth power');
assertEq(evaluateArithmetic('2 to the eighth'), 256, 'spoken eighth power');
assertEq(evaluateArithmetic('two to the eighth'), 256, 'spoken two to the eighth');
assertEq(evaluateArithmetic('two plus two'), 4, 'spoken number words');
assertEq(evaluateArithmetic('two to the power of eight'), 256, 'spoken number power');
assertEq(evaluateArithmetic('two'), null, 'bare number word stays a search');
assertEq(evaluateArithmetic('negative 3 plus 5'), 2, 'spoken negative');
assertEq(evaluateArithmetic('sometimes'), null, 'times stays inside a word');
assertEq(evaluateArithmetic('plus'), null, 'bare plus is not math');
assertEq(evaluateArithmetic('leftover'), null, 'over stays inside a word');
assertEq(evaluateArithmetic('1+2='), 3, 'trailing equals from a paste');
assertEq(evaluateArithmetic('1 000 + 2'), 1002, 'spaced thousands');
assertEq(evaluateArithmetic('1 000 000 / 2'), 500000, 'spaced millions');
assertEq(evaluateArithmetic('1+2=3'), 3, 'equation paste keeps the left side');
assertEq(evaluateArithmetic('50% of 80=40'), 40, 'percent equation paste');
assertEq(evaluateArithmetic('1\u00a0+\u00a02'), 3, 'nbsp from a paste');
assertEq(evaluateArithmetic('π²'), Math.pow(Math.PI, 2), 'pi squared');
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
assert(isUrlQuery('example.com.'), 'trailing fqdn dot is a url');
assertEq(normalizeUrl('example.com.'), 'https://example.com', 'strip trailing fqdn dot');
assertEq(normalizeUrl('https://example.com.'), 'https://example.com', 'strip https trailing dot');
assertEq(normalizeUrl('www.example.com.'), 'https://www.example.com', 'strip www trailing dot');
assert(!isUrlQuery('readme.md.'), 'trailing-dot markdown is not a url');
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
assert(!isUrlQuery('app.mjs'), 'mjs module is not a url');
assert(!isUrlQuery('data.csv'), 'csv is not a url');
assert(!isUrlQuery('style.scss'), 'scss is not a url');
assert(!isPlausibleWebHost('node.js'), 'js tld rejected');
assert(isUrlQuery('site.de'), 'country domain is a url');
assert(isUrlQuery('nas.local'), 'mdns host is a url');
assertEq(normalizeUrl('nas.local'), 'http://nas.local', 'mdns uses http');
assert(isUrlQuery('sftp://nas.local/share'), 'sftp url');
assert(isUrlQuery('smb://nas/public'), 'smb url');
assert(isUrlQuery('mailto:nin@example.com'), 'mailto url');
assert(isUrlQuery('magnet:?xt=urn:btih:abc'), 'magnet url');
assert(isUrlQuery('magnet:xt=urn:btih:abc'), 'magnet without question mark');
assert(!isUrlQuery('javascript:alert(1)'), 'javascript is not a url');
assert(isUnsafeLaunchUri('javascript:alert(1)'), 'javascript is unsafe');
assert(isUnsafeLaunchUri('DATA:text/html,hi'), 'data is unsafe');
assert(!isUnsafeLaunchUri('https://example.com'), 'https is safe');
assertEq(normalizeUrl('javascript:alert(1)'), null, 'javascript normalize is rejected');
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
assert(!canOpenPopup(false, false, false, false, true), 'screen-time limit blocks');
assert(sessionLimitsReached(TIME_LIMITS_REACHED), 'gnome 50 limit reached');
assert(!sessionLimitsReached(0), 'disabled time limits');
assertEq(timeLimitsState(null), 0, 'missing manager is disabled');
assertEq(timeLimitsState({state: TIME_LIMITS_REACHED}), TIME_LIMITS_REACHED, 'manager state');
assert(shouldCloseOnToggle(true, false), 'idle gap still toggles closed');
assert(shouldCloseOnToggle(false, true), 'visible toggles closed');
assert(!shouldCloseOnToggle(false, false), 'closed stays closed');
assert(shouldCloseOnSession(true, false), 'lock closes an open popup');
assert(shouldCloseOnSession(false, true), 'greeter closes an open popup');
assert(!shouldCloseOnSession(false, false), 'unlocked session keeps the popup');
assert(shouldCloseOnSession(false, false, true), 'screen-time limit closes an open popup');

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
const shortTop = {x: 0, y: 0, width: 800, height: 200};
const rawTop = popupOrigin(shortTop, 600, 80, 'top');
const liftedTop = liftOriginForResults(rawTop, shortTop, 80, MIN_RESULTS_HEIGHT);
assert(liftedTop.y < rawTop.y, 'short top look lifts for results');
const placedShort = placePopup(shortTop, 600, 80, 'top', 800);
assert(placedShort.resultsMax >= MIN_RESULTS_HEIGHT, 'lifted top look keeps a usable list');
const placedTall = placePopup(work, 600, 80, 'center', 400);
assertEq(placedTall.y, popupOrigin(work, 600, 80, 'center').y, 'tall work keeps the empty origin');
assertEq(placedTall.resultsMax, 400, 'tall work keeps requested results height');
const packed = {x: 0, y: 0, width: 400, height: 80};
assertEq(placePopup(packed, 200, 80, 'center', 400).resultsMax, 0, 'entry-sized work still hides overflow');

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
assertEq(rowTouchPhase('touch-begin'), 'press', 'touch begin is press');
assertEq(rowTouchPhase('touch-end'), 'release', 'touch end is release');
assertEq(rowTouchPhase('touch-cancel'), 'leave', 'touch cancel is leave');
assertEq(rowTouchPhase('touch-update'), 'hold', 'touch move holds');
assertEq(rowPointerAction('hold', PRIMARY_BUTTON, true).action, 'stop', 'held touch stays claimed');
assertEq(rowPointerAction('release', PRIMARY_BUTTON, true).action, 'activate', 'touch end after begin activates');

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
assertEq(normalizeActionQuery('lock the screen'), 'lock screen', 'drop filler words');
assertEq(normalizeActionQuery('lock now'), 'lock', 'drop now');
assert(actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'lock the screen'), 'spoken lock');
assert(actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'lock now'), 'lock now');
assert(actionMatchesQuery({title: 'Power Off', keywords: ['shutdown', 'shut down', 'turn off']}, 'shut down the computer'), 'spoken shutdown');
assert(actionMatchesQuery({title: 'Power Off', keywords: ['turn off']}, 'turn off'), 'turn off');
assert(actionMatchesQuery({title: 'Power Off', keywords: ['power off']}, 'power off'), 'power off');
assert(actionMatchesQuery({title: 'Log Out', keywords: ['sign out', 'sign off']}, 'sign out'), 'sign out');
assert(actionMatchesQuery({title: 'Log Out', keywords: ['sign off']}, 'sign off'), 'sign off');
assert(actionMatchesQuery({title: 'Lock Screen Rotation', keywords: ['lock orientation']}, 'lock orientation'), 'lock orientation');
assert(actionMatchesQuery({title: 'Unlock Screen Rotation', keywords: ['unlock']}, 'unlock'), 'unlock rotation');
assert(actionMatchesQuery({title: 'Take a Screenshot', keywords: ['record']}, 'record'), 'record screenshot');
assertEq(actionTitle({title: 'Lock Screen Rotation'}, null), 'Lock Screen Rotation', 'static rotation title');
assertEq(actionTitle({
    title: 'Lock Screen Rotation',
    titleFor: () => 'Unlock Screen Rotation',
}, {}), 'Unlock Screen Rotation', 'live rotation title');
assertEq(actionTitle({
    title: 'Lock Screen Rotation',
    titleFor: () => '',
}, {}), 'Lock Screen Rotation', 'empty live title falls back');
assertEq(actionIcon({
    icon: 'rotation-locked-symbolic',
    iconFor: () => 'rotation-allowed-symbolic',
}, {}), 'rotation-allowed-symbolic', 'live rotation icon');
assertEq(actionTitle({
    title: 'Power Off',
    titleFor: liveActionName('power-off'),
}, {getName: id => id === 'power-off' ? 'Power Off' : ''}), 'Power Off', 'live power-off title');
assertEq(actionIcon({
    icon: 'system-shutdown-symbolic',
    iconFor: liveActionIcon('power-off'),
}, {getIconName: id => id === 'power-off' ? 'system-shutdown-symbolic' : ''}), 'system-shutdown-symbolic', 'live power-off icon');
assertEq(actionTitle({
    title: 'Power Off',
    titleFor: liveActionName('power-off'),
}, {}), 'Power Off', 'missing getName falls back');

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
assertEq(evaluateArithmetic('2pi^2'), 2 * Math.PI * Math.PI, 'implicit multiply is a term');
assertEq(evaluateArithmetic('2^3pi'), 8 * Math.PI, 'power then implicit multiply');
assertEq(evaluateArithmetic('2(3)^2'), 18, 'implicit paren then power');
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
assertEq(evaluateArithmetic('e+1'), Math.E + 1, 'euler plus');
assertEq(evaluateArithmetic('e+e'), 2 * Math.E, 'euler plus euler');
assertEq(evaluateArithmetic('-e'), -Math.E, 'unary euler');
assertEq(evaluateArithmetic('e', true), Math.E, 'bare e with prefix');
assertEq(evaluateArithmetic('e'), null, 'bare e stays a search');
assertEq(evaluateArithmetic('sqrt'), null, 'function needs parens');
assertEq(evaluateArithmetic('0xff'), null, 'bare hex still a search');
assertEq(evaluateArithmetic('log(100)'), 2, 'log10');
assertEq(evaluateArithmetic('log2(8)'), 3, 'log2');
assertEq(evaluateArithmetic('2log2(8)'), 6, 'implicit times log2');
assertEq(evaluateArithmetic('ln(1)'), 0, 'natural log');
assertEq(evaluateArithmetic('asin(1)'), 90, 'asin uses degrees');
assertEq(evaluateArithmetic('acos(0)'), 90, 'acos uses degrees');
assertEq(evaluateArithmetic('atan(0)'), 0, 'atan uses degrees');
assertEq(evaluateArithmetic('asin(2)'), null, 'asin domain');
assertEq(evaluateArithmetic('round(1.5)'), 2, 'round');
assertEq(evaluateArithmetic('floor(1.9)'), 1, 'floor');
assertEq(evaluateArithmetic('ceil(1.1)'), 2, 'ceil');
assertEq(evaluateArithmetic('5!'), 120, 'factorial');
assertEq(evaluateArithmetic('3!+1'), 7, 'factorial then add');
assertEq(evaluateArithmetic('(-3)!'), null, 'negative factorial rejected');
assertEq(parseUnitQuery('10 km to mi').from, 'km', 'unit from');
assertEq(parseUnitQuery('ten km to mi').value, 10, 'spoken ten km');
assertEq(parseUnitQuery('how many miles in ten km').value, 10, 'how many ten km');
assertEq(Math.round(convertQuery('ten km to mi').title.split(' ')[0] * 1000) / 1000, 6.214, 'ten km converts');
assertEq(Math.round(convertQuery('thirteen km to mi').title.split(' ')[0] * 1000) / 1000, 8.078, 'thirteen km converts');
assertEq(convertQuery('1/2 cup to ml').description, '0.5 cup', 'half cup fraction');
assertEq(parseUnitQuery('three thousand km to mi').value, 3000, 'three thousand km');
assertEq(parseUnitQuery('twenty km to mi').value, 20, 'twenty km');
assertEq(parseUnitQuery('a hundred km to mi').value, 100, 'a hundred km');
assertEq(parseUnitQuery('one hundred and twenty km to mi').value, 120, 'one hundred and twenty km');
assertEq(parseUnitQuery('forty five km to mi').value, 45, 'forty five km');
assertEq(Math.round(convertQuery('10 kms to mi').title.split(' ')[0] * 1000) / 1000, 6.214, 'kms alias');
assertEq(parseUnitQuery('10km to miles').to, 'miles', 'unit to alias');
assertEq(parseUnitQuery('10 km into mi').to, 'mi', 'into synonym');
assertEq(parseUnitQuery('10 km as miles').to, 'miles', 'as synonym');
assertEq(parseUnitQuery('how many miles in 10 km').from, 'km', 'how many from');
assertEq(parseUnitQuery('how many miles in 10 km').to, 'miles', 'how many to');
assertEq(parseUnitQuery('how many miles in 10 km').value, 10, 'how many value');
assertEq(parseUnitQuery('how many miles is 10 km').to, 'miles', 'how many is');
assertEq(parseUnitQuery('how many miles are in 10 km').to, 'miles', 'how many are in');
assertEq(parseUnitQuery('how many miles are 10 km').from, 'km', 'how many are');
assertEq(parseUnitQuery('how many miles are 10 km').to, 'miles', 'how many are to');
assertEq(parseUnitQuery('how many miles are there in 10 km').from, 'km', 'how many are there in');
assertEq(parseUnitQuery('how many miles are there in 10 km').to, 'miles', 'how many are there in to');
assertEq(Math.round(convertQuery('how many miles in 10 km').title.split(' ')[0] * 1000) / 1000, 6.214, 'how many converts');
assertEq(parseUnitQuery('180° into rad').from, 'deg', 'degree into');
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
assertEq(parseUnitQuery('1,000 km to mi').value, 1000, 'unit thousands comma');
assertEq(parseUnitQuery('1 000 km to mi').value, 1000, 'unit thousands space');
assertEq(parseUnitQuery('1 000 000 m to km').value, 1000000, 'unit millions space');
assertEq(parseUnitQuery('1e3 km to mi').value, 1000, 'unit scientific');
assertEq(parseUnitQuery('1.5e2 f to c').value, 150, 'unit scientific float');
assertEq(convertQuery('1e-3 km to m').title, '1 m', 'unit scientific milli');
assertEq(parseUnitQuery('1,000,000 m to km').value, 1000000, 'unit millions comma');
assertEq(convertUnits(1024, 'b', 'kib').value, 1, 'bytes to kib');
assertEq(convertQuery('1024 bytes to kib').title, '1 kib', 'bytes query');
assertEq(convertQuery('2 hours to min').title, '120 min', 'hours to minutes');
assertEq(convertQuery('1 day to h').title, '24 h', 'day to hours');
assertEq(convertQuery('.5 km to m').title, '500 m', 'leading decimal unit');
assertEq(Math.round(convertQuery('1 acre to m2').title.split(' ')[0]), 4047, 'acre to m2');
assertEq(convertQuery('1 ha to m2').title, '10000 m2', 'hectare to m2');
assertEq(convertUnits(1, 'min', 'm'), null, 'minutes are not meters');
assertEq(convertQuery('2 hrs to min').title, '120 min', 'hrs alias');
assertEq(convertQuery('60 secs to min').title, '1 min', 'secs alias');
assertEq(convertQuery('1 m3 to l').title, '1000 l', 'cubic meters to liters');
assertEq(convertQuery('1 m³ to l').title, '1000 l', 'unicode cubic meters');
assertEq(convertQuery('1 cc to ml').title, '1 ml', 'cc is a cubic centimeter');
assertEq(Math.round(convertUnits(100, 'kph', 'mph').value), 62, '100 kph is about 62 mph');
assertEq(Math.round(convertQuery('1 atm to kpa').title.split(' ')[0]), 101, '1 atm is 101 kpa');
assertEq(convertQuery('32 psi to bar').title.split(' ')[1], 'bar', 'psi converts');
assertEq(convertQuery('760 mmhg to atm').title.split(' ')[1], 'atm', 'mmhg converts');
assertEq(convertQuery('100 km/h to mph').title.split(' ')[1], 'mph', 'slash speed unit');
assertEq(convertQuery('10 m/s to kph').title.split(' ')[1], 'kph', 'meters per second');
assertEq(parseUnitQuery('1 m² to ft2').from, 'm2', 'unicode superscript unit');
assert(convertQuery('1 m² to ft2'), 'unicode area converts');
assertEq(convertQuery('200 kcal to kj').title, '836.8 kj', 'food energy');
assertEq(convertQuery('200 calories to kj').title, '836.8 kj', 'calories means kcal');
assertEq(convertUnits(1, 'cal', 'j').value, 4.184, 'thermochemical calorie');
assertEq(convertQuery('1 kwh to kj').title, '3600 kj', 'kilowatt hour');
assertEq(Math.round(convertUnits(1, 'hp', 'w').value), 746, 'mechanical horsepower');
assertEq(convertQuery('100 w to kw').title, '0.1 kw', 'watts');
assert(Math.abs(convertUnits(180, 'deg', 'rad').value - Math.PI) < 1e-10, '180 deg is pi rad');
assertEq(parseUnitQuery('180° to rad').from, 'deg', 'bare degree symbol is deg');
assertEq(parseUnitQuery('180 degrees to rad').from, 'degrees', 'degrees word is the angle unit');
assertEq(parseUnitQuery('32 degrees f to c').from, 'f', 'degrees before a temp letter still strips');
assertEq(convertQuery('1 cup to tbsp').title, '16 tbsp', 'cup to tablespoons');
assertEq(convertQuery('3 tsp to tbsp').title, '1 tbsp', 'teaspoons to tablespoons');
assertEq(parseUnitQuery('1 fl oz to ml').from, 'floz', 'fluid ounce words');
assertEq(Math.round(convertQuery('1 floz to ml').title.split(' ')[0]), 30, 'us fluid ounce');
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
assert(appMatchTier('Google Chrome', 'Web Browser', 'google-chrome.desktop', ['browser'], 'chrome browser') >= 0, 'name plus generic');
assert(appMatchTier('Firefox', 'Web Browser', 'firefox.desktop', ['browser'], 'firefox browser') >= 0, 'firefox browser');
assertEq(appMatchTier('Notes', '', 'notes.desktop', [], 'chrome browser'), -1, 'unrelated two words miss');
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
assertEq(settingsPanelDesktop('wellbeing'), 'gnome-wellbeing-panel.desktop', 'wellbeing desktop id');
assert(settingsPanelAvailable('wifi', () => false), 'wifi stays without a desktop probe');
assert(!settingsPanelAvailable('wellbeing', () => false), 'missing wellbeing desktop hides the row');
assert(settingsPanelAvailable('wellbeing', id => id === 'gnome-wellbeing-panel.desktop'), 'present wellbeing desktop keeps the row');
assert(!matchSettingsPanels('wellbeing', 5, id => settingsPanelAvailable(id, () => false)).some(p => p.id === 'wellbeing'), 'gated wellbeing is omitted');
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
assertEq(settingsResultMeta({title: 'Wi-Fi', icon: 'network-wireless-symbolic'}, null).activatable, false, 'no launcher stays closed');
assertEq(settingsResultMeta({id: 'wifi', title: 'Wi-Fi', icon: 'network-wireless-symbolic'}, ['gnome-control-center', 'wifi']).id, 'wifi', 'settings row id');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'directory', '/home/u').id, '/home/u/docs', 'path row id');
assertEq(settingsResultMeta({title: 'Wi-Fi', icon: 'network-wireless-symbolic'}, ['gnome-control-center', 'wifi']).activatable, true, 'settings launch is activatable');
assert(readFileSync('prefs/featuresPage.js', 'utf8').includes('actionsRow.sensitive'), 'actions switch follows apps');

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
const noWebFallback = Object.assign({}, allOn, {web: false});
assertEq(planSearch('@cats', noWebFallback).providers.join(','), 'web', 'at prefix survives fallback off');
assert(!planSearch('chrome', noWebFallback).webFallback, 'fallback stays off without at');
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
assertEq(stripLeadingVerb('please open firefox'), 'firefox', 'please open');
assertEq(stripLeadingVerb('please lock'), 'lock', 'please lock');
assertEq(stripLeadingVerb('can you open firefox'), 'firefox', 'can you open');
assertEq(stripLeadingVerb('could you launch gimp'), 'gimp', 'could you launch');
assertEq(stripLeadingVerb('would you please open firefox'), 'firefox', 'would you please open');
assertEq(stripLeadingVerb('can you please open firefox'), 'firefox', 'can you please open');
assertEq(stripLeadingVerb('please can you open firefox'), 'firefox', 'please can you open');
assertEq(stripLeadingVerb('will you open firefox'), 'firefox', 'will you open');
assertEq(stripLeadingVerb('can you close firefox'), 'close firefox', 'can you close');
assertEq(stripLeadingVerb('what is 2+2'), '2+2', 'what is math');
assertEq(stripLeadingVerb("what's 2+2"), '2+2', 'whats math');
assertEq(stripLeadingVerb('what is the time'), 'time', 'what is the time');
assertEq(stripLeadingVerb('calculate 2+2'), '2+2', 'calculate math');
assertEq(stripLeadingVerb('convert 10 km to mi'), '10 km to mi', 'convert units');
assertEq(stripLeadingVerb('how much is 10 km to mi'), '10 km to mi', 'how much is units');
assertEq(stripLeadingVerb('please convert 10 km to mi'), '10 km to mi', 'please convert');
assertEq(stripLeadingVerb('open my documents'), 'documents', 'open my documents');
assertEq(stripLeadingVerb('show me firefox'), 'firefox', 'show me');
assertEq(stripLeadingVerb('show me the time'), 'time', 'show me the time');
assertEq(stripLeadingVerb('tell me the time'), 'time', 'tell me the time');
assertEq(stripLeadingVerb('can you tell me the time'), 'time', 'can you tell me the time');
assertEq(stripLeadingVerb('please tell me the date'), 'date', 'please tell me the date');
assertEq(stripLeadingVerb('tell me firefox'), 'firefox', 'tell me app');
assertEq(stripLeadingVerb('my downloads'), 'downloads', 'my downloads');
assertEq(stripLeadingVerb('the'), 'the', 'bare the stays');
assertEq(stripLeadingVerb('open the'), 'the', 'open the stays');
assertEq(stripLeadingVerb('can you'), 'can you', 'bare can you stays');
assertEq(stripLeadingVerb('open firefox'), 'firefox', 'open verb');
assertEq(stripLeadingVerb('switch to term'), 'term', 'switch to verb');
assertEq(stripLeadingVerb('launch code'), 'code', 'launch verb');
assertEq(stripLeadingVerb('go to downloads'), 'downloads', 'go to verb');
assertEq(stripLeadingVerb('find firefox'), 'firefox', 'find verb');
assertEq(stripLeadingVerb('search for wifi'), 'wifi', 'search for verb');
assertEq(stripLeadingVerb('look up hex'), 'hex', 'look up verb');
assertEq(stripLeadingVerb('lookup hex'), 'hex', 'lookup verb');
assertEq(stripLeadingVerb('help me open firefox'), 'firefox', 'help me open');
assertEq(stripLeadingVerb('just open firefox'), 'firefox', 'just open');
assertEq(stripLeadingVerb('i want to open firefox'), 'firefox', 'i want to open');
assertEq(stripLeadingVerb('navigate to downloads'), 'downloads', 'navigate to place');
assertEq(stripLeadingVerb('navigate to wifi settings'), 'wifi', 'navigate to settings');
assertEq(stripLeadingVerb('help me'), 'help me', 'bare help me stays');
assertEq(stripLeadingVerb('just'), 'just', 'bare just stays');
assertEq(stripLeadingVerb('find windows firefox'), 'firefox', 'find windows category');
assertEq(stripLeadingVerb('search settings wifi'), 'wifi', 'search settings category');
assertEq(stripLeadingVerb('open the pictures folder'), 'pictures', 'pictures folder');
assertEq(stripLeadingVerb('open pictures dir'), 'pictures', 'pictures dir');
assertEq(stripLeadingVerb('open wifi settings'), 'wifi', 'wifi settings');
assertEq(stripLeadingVerb('open display preferences'), 'display', 'display preferences');
assertEq(stripLeadingVerb('open my documents folder'), 'documents', 'documents folder');
assertEq(stripLeadingVerb('find files notes'), 'notes', 'find files category');
assertEq(stripLeadingVerb('search for app firefox'), 'firefox', 'search for app category');
assertEq(stripLeadingVerb('windows'), 'windows', 'bare windows stays');
assertEq(stripLeadingVerb('folder'), 'folder', 'bare folder stays');
assertEq(stripLeadingVerb('search for open source'), 'open source', 'search for keeps the rest');
assertEq(planSearch('search firefox', allOn).query, 'firefox', 'plan strips search');
assertEq(stripLeadingVerb('firefox'), 'firefox', 'no verb stays');
assertEq(stripLeadingVerb('open'), 'open', 'bare open stays');
assertEq(planSearch('open firefox', allOn).query, 'firefox', 'plan strips open');
assertEq(planSearch('can you open firefox', allOn).query, 'firefox', 'plan strips can you open');
assertEq(planSearch('open my documents', allOn).query, 'documents', 'plan strips open my');
assertEq(planSearch('what is 2+2', allOn).query, '2+2', 'plan strips what is');
assertEq(planSearch('what is 2 plus 2', allOn).query, '2 plus 2', 'plan strips what is plus');
assertEq(planSearch('show me the time', allOn).query, 'time', 'plan strips show me the');
assertEq(planSearch('tell me the time', allOn).query, 'time', 'plan strips tell me the');
assertEq(planSearch('find windows firefox', allOn).query, 'firefox', 'plan strips windows category');
assertEq(planSearch('open the pictures folder', allOn).query, 'pictures', 'plan strips folder noun');
assertEq(planSearch('open wifi settings', allOn).query, 'wifi', 'plan strips settings noun');
assertEq(planSearch('workspace two', allOn).query, 'workspace two', 'plan keeps workspace two');
assertEq(planSearch('$ windows firefox', allOn).query, 'firefox', 'windows prefix strips category');
assertEq(planSearch('# settings wifi', allOn).query, 'wifi', 'settings prefix strips category');
assertEq(planSearch('tell me what time it is', allOn).query, 'what time it is', 'plan keeps inverted time');
assertEq(evaluateArithmetic(planSearch('what is 2 plus 2', allOn).query), 4, 'spoken what is plus evaluates');
assertEq(evaluateArithmetic(planSearch('what is two plus two', allOn).query), 4, 'spoken what is number words');
assertEq(timeQueryKind(planSearch('tell me what time it is', allOn).query), 'time', 'inverted time after tell me');
assertEq(timeQueryKind(planSearch("what's the time right now", allOn).query), 'time', 'time right now after strip');
assertEq(planSearch('what is the answer to 2+2', allOn).query, '2+2', 'answer to math');
assertEq(evaluateArithmetic(planSearch('what is the answer to 2+2', allOn).query), 4, 'answer to evaluates');
assertEq(timeQueryKind(planSearch('what time is it right now', allOn).query), 'time', 'what time is it right now');
assertEq(normalizeTimeQuery('time right now'), 'time', 'normalize time right now');
assertEq(normalizeTimeQuery('now'), 'now', 'bare now stays now');
assert(matchPlaces(planSearch('open the pictures folder', allOn).query).some(p => p.id === 'pictures'), 'pictures folder is a place');
assertEq(planSearch('convert 10 km to mi', allOn).query, '10 km to mi', 'plan strips convert');
assertEq(planSearch('can you close firefox', allOn).query, 'close firefox', 'plan keeps close intent');
assertEq(planSearch('switch to term', allOn).query, 'term', 'plan strips switch to');
assertEq(planSearch('$ switch to term', allOn).query, 'term', 'windows prefix strips switch to');
assertEq(planSearch('@ open cats', allOn).query, 'open cats', 'web prefix keeps the words');
assertEq(planSearch('=open 2', allOn).query, 'open 2', 'calc prefix keeps the words');
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
assert(windowMatches('Firefox', 'Navigator', 'firefox navigator'), 'title plus class words');
assert(!windowMatches('Firefox', 'Navigator', 'firefox chrome'), 'unrelated window words');
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
assert(windowRecencyValue(0, 3, 0) > windowRecencyValue(1, 3, 0), 'alt-tab front ranks first');
assert(windowRecencyValue(0, 3, 0) > windowRecencyValue(-1, 0, 999), 'tab list beats user time');
assertEq(windowRecencyValue(-1, 3, 50), 50, 'missing tab uses user time');
assertEq(windowWorkspaceLabel(0), 'Workspace 1', 'first workspace is 1-based');
assertEq(windowWorkspaceLabel(2), 'Workspace 3', 'later workspace');
assertEq(windowWorkspaceLabel(-1), 'Switch to window', 'unknown workspace');
assertEq(windowWorkspaceLabel(1, true), 'On all workspaces', 'sticky window');
assertEq(parseWindowCloseQuery('close firefox').intent, 'close', 'close intent');
assertEq(parseWindowCloseQuery('close firefox').title, 'firefox', 'close title');
assertEq(parseWindowCloseQuery('close the firefox').title, 'firefox', 'close the title');
assertEq(parseWindowCloseQuery('close my terminal').title, 'terminal', 'close my title');
assertEq(parseWindowCloseQuery('close the firefox window').title, 'firefox', 'close the window noun');
assertEq(parseWindowCloseQuery('close the firefox application').title, 'firefox', 'close the application noun');
assertEq(parseWindowCloseQuery('kill firefox windows').title, 'firefox', 'kill windows noun');
assertEq(parseWindowCloseQuery('KILL Chrome').intent, 'kill', 'kill intent');
assertEq(parseWindowCloseQuery('quit notes').intent, 'quit', 'quit intent');
assertEq(parseWindowCloseQuery('force-quit firefox').intent, 'kill', 'force-quit is kill');
assertEq(parseWindowCloseQuery('force quit chrome').intent, 'kill', 'force quit is kill');
assertEq(parseWindowCloseQuery('force close firefox').intent, 'kill', 'force close is kill');
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
assertEq(parseWorkspaceSwitchQuery('workspace two').number, 2, 'workspace two');
assertEq(parseWorkspaceSwitchQuery('workspace twenty').number, 20, 'workspace twenty');
assertEq(parseWorkspaceSwitchQuery('switch to workspace twenty-one').number, 21, 'workspace twenty-one');
assertEq(parseWorkspaceSwitchQuery('switch to workspace two').index, 1, 'switch to workspace two');
assert(workspaceLabelMatches('Workspace 2', 'workspace two'), 'label workspace two');
assert(workspaceLabelMatches('Workspace 3', 'ws three'), 'label ws three');
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
  <bookmark href="sftp://nas.local/share/notes.txt"/>
  <bookmark href="javascript:alert(1)"/>
  <bookmark href="file:///tmp/notes.txt"/>
  <bookmark href="file:///home/user/My%20File.pdf"/>
</xbel>`;
assertEq(parseRecentXbel(xbel).length, 3, 'xbel keeps file and sftp skips web');
assert(parseRecentXbel(xbel).includes('sftp://nas.local/share/notes.txt'), 'xbel sftp');
assertEq(remoteHostFromUri('sftp://me@nas.local/share'), 'nas.local', 'remote recent host');
assertEq(remoteHostFromUri('file:///tmp/a'), '', 'file uri has no host');
assertEq(parseRecentXbel(xbel)[2], 'file:///home/user/My%20File.pdf', 'keep encoded uri');
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
assert(recentFileMatches('notes.txt', '~/Documents', 'notes documents'), 'name plus folder words');
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
assert(!shouldOfferApp(true, false, true, false), 'still hide before give up');
assert(shouldOfferApp(true, false, true, true), 'show after parental give up');
assert(shouldOfferApp(true, true, true), 'show after parental init');
assert(!shouldOfferApp(false, true, true), 'hidden desktop files stay hidden');
assert(!shouldOfferApp(false, false, false, true), 'hidden desktop files stay hidden after give up');
assertEq(PARENTAL_GIVE_UP_MS, 5000, 'parental give up waits five seconds');
assert(!hasParentalGiveUp(), 'give up starts unset');
markParentalGiveUp();
assert(hasParentalGiveUp(), 'give up can be marked');
resetParentalGiveUp();
assert(!hasParentalGiveUp(), 'disable clears give up');
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
assert(commandFileIsReady(false, true), 'regular executable is ready');
assert(!commandFileIsReady(true, true), 'directory is not a command');
assert(!commandFileIsReady(false, false), 'non-executable file is not ready');
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
assertEq(resolveSpawnPath('scripts/deploy', '/home/u'), '/home/u/scripts/deploy', 'home-relative slash exe');
assertEq(resolveSpawnPath('ls', '/home/u'), 'ls', 'bare name stays for PATH');
assertEq(resolveSpawnPath('./tool', '/home/u'), '/home/u/tool', 'dot slash exe');
assertEq(resolveCommandArgv(['scripts/deploy', 'notes.txt'], '/home/u').join(','), '/home/u/scripts/deploy,notes.txt', 'only exe is made absolute');
assertEq(extraPathDirs('/home/u').join(','), '/home/u/.local/bin,/home/u/.local/share/flatpak/exports/bin,/home/u/.cargo/bin,/home/u/go/bin,/home/u/bin,/var/lib/flatpak/exports/bin', 'user path dirs');
assertEq(findUserProgram('tool', () => null, p => p === '/home/u/go/bin/tool', extraPathDirs('/home/u')), '/home/u/go/bin/tool', 'finds ~/go/bin');
assertEq(joinPathDirs(['/home/u/.local/bin'], '/usr/bin'), '/home/u/.local/bin:/usr/bin', 'user path prepends');
assertEq(findUserProgram('gh', () => null, p => p === '/home/u/.local/bin/gh', extraPathDirs('/home/u')), '/home/u/.local/bin/gh', 'finds ~/.local/bin');
assertEq(findUserProgram('ls', () => '/bin/ls', () => false, extraPathDirs('/home/u')), '/bin/ls', 'system PATH wins');
assertEq(pathRowMeta('~/nope', '/home/u/nope', 'missing').description, 'Path not found', 'missing path');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'directory').icon, 'folder-symbolic', 'dir icon');
assertEq(pathRowMeta('/tmp/a.pdf', '/tmp/a.pdf', 'file').icon, 'x-office-document-symbolic', 'file icon');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'directory', '/home/u').title, '~/docs', 'path title collapses home');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'pending', '/home/u').description, 'Checking path', 'pending path');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'pending', '/home/u').title, '~/docs', 'pending title collapses home');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'pending', '/home/u').icon, 'folder-symbolic', 'pending path icon');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'pending', '/home/u').activatable, false, 'pending path not activatable');
assertEq(pathRowMeta('~/nope', '/home/u/nope', 'missing').activatable, false, 'missing path not activatable');
assertEq(pathRowMeta('~/docs', '/home/u/docs', 'directory').activatable, undefined, 'ready path stays activatable');
assert(!resultCanActivate(pathRowMeta('~/docs', '/home/u/docs', 'pending', '/home/u')), 'pending path cannot activate');
assert(resultCanActivate({activate: () => {}}), 'normal result can activate');
assert(!resultCanActivate({activate: () => {}, activatable: false}), 'flag blocks activate');
assertEq(terminalSpec(name => name === 'xdg-terminal-exec').argv[0], 'xdg-terminal-exec', 'prefer xdg-terminal-exec');
assert(terminalCommand(name => name === 'ptyxis', '/tmp/docs').argv.includes('--working-directory=/tmp/docs'), 'ptyxis working dir');
assertEq(terminalCommand(name => name === 'xdg-terminal-exec', '/tmp/docs').cwd, '/tmp/docs', 'xdg-terminal-exec uses cwd');
assertEq(terminalSpec(name => name === 'foot').argv[0], 'foot', 'foot fallback');
assert(terminalCommand(name => name === 'kitty', '/tmp/docs').argv.includes('--directory=/tmp/docs'), 'kitty working dir');
assert(terminalCommand(name => name === 'ghostty', '/tmp/docs').argv.includes('--working-directory=/tmp/docs'), 'ghostty working dir');
assertEq(terminalSpec(name => name === 'alacritty').argv[0], 'alacritty', 'alacritty fallback');
assert(terminalCommand(name => name === 'wezterm', '/tmp/docs').argv.includes('--cwd=/tmp/docs'), 'wezterm cwd');
assertEq(terminalSpec(name => name === 'tilix').argv[0], 'tilix', 'tilix fallback');
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
assertEq(normalizeBookmarkUri('/home/u/Music'), 'file:///home/u/Music', 'bare bookmark path');
assertEq(normalizeBookmarkUri('~/Music', '/home/u'), 'file:///home/u/Music', 'home bookmark path');
assertEq(normalizeBookmarkUri('javascript:alert(1)'), '', 'javascript bookmark rejected');
assertEq(parseGtkBookmarks('/home/u/Music Tunes')[0].uri, 'file:///home/u/Music', 'legacy gtk path becomes file uri');
assertEq(parseGtkBookmarks('~/Docs Notes', '/home/u')[0].uri, 'file:///home/u/Docs', 'tilde bookmark expands');
assertEq(parseGtkBookmarks('javascript:alert(1) Evil').length, 0, 'unsafe bookmark skipped');
assertEq(parsedMarks[0].title, 'Code', 'first bookmark keeps label');
assertEq(parsedMarks[1].title, 'NAS', 'remote bookmark label');
assertEq(mergeBookmarkFiles(['file:///a A', 'file:///a B\nfile:///b B']).length, 2, 'merge unique uris');
assert(bookmarkMatches('Code', '~/Projects', 'cod'), 'bookmark title prefix');
assert(bookmarkMatches('Notes', '~/Documents', 'doc'), 'bookmark folder match');
assert(bookmarkMatches('Notes', '~/Documents', 'notes documents'), 'bookmark title plus folder');
assert(!bookmarkMatches('Code', '~/Projects', 'o'), 'letter o is not a bookmark');
assertEq(matchBookmarks([{title: 'Code', description: '~/x'}, {title: 'Zed', description: '~/z'}], 'z', 2).length, 1, 'bookmark filter');
assertEq(matchSettingsPanels('', 5).length, 5, 'empty settings query lists panels');
assertEq(timeQueryKind('time'), 'time', 'time query');
assertEq(timeQueryKind('NOW'), 'time', 'now query');
assertEq(timeQueryKind('today'), 'date', 'today query');
assertEq(timeQueryKind('clock'), 'time', 'clock query is time');
assertEq(timeQueryKind('what time is it'), 'time', 'spoken time query');
assertEq(timeQueryKind('what time is it now'), 'time', 'spoken time now');
assertEq(timeQueryKind('what time it is'), 'time', 'inverted spoken time');
assertEq(timeQueryKind('what the time is'), 'time', 'what the time is');
assertEq(timeQueryKind('what day it is'), 'date', 'inverted spoken day');
assertEq(timeQueryKind('what the date is'), 'date', 'what the date is');
assertEq(timeQueryKind("what's the time"), 'time', 'apostrophe time query');
assertEq(timeQueryKind('what is the date'), 'date', 'spoken date query');
assertEq(timeQueryKind("today's date"), 'date', 'todays date');
assertEq(timeQueryKind('date today'), 'date', 'date today');
assertEq(timeQueryKind('what day is it'), 'date', 'what day is it');
assertEq(timeQueryKind('what day is it today'), 'date', 'what day is it today');
assertEq(timeQueryKind('current date'), 'date', 'current date query');
assertEq(timeQueryKind('timeout'), null, 'timeout is not time');
assertEq(timeQueryKind('tomorrow'), 'tomorrow', 'tomorrow query');
assertEq(timeQueryKind('yesterday'), 'yesterday', 'yesterday query');
assertEq(timeQueryKind('yesterdays'), null, 'yesterdays is not yesterday');
assertEq(dateOffsetDays('yesterday'), -1, 'yesterday offset');
assertEq(dateOffsetDays('tomorrow'), 1, 'tomorrow offset');
assertEq(dateOffsetDays('time'), 0, 'clock offset');
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
assertEq(normalizeRgbColor('rgb(100%, 0%, 0%)'), '#ff0000', 'rgb percent');
assertEq(normalizeRgbColor('rgb(100% 0% 0%)'), '#ff0000', 'modern rgb percent');
assertEq(normalizeRgbColor('rgb(100 %, 0 %, 0 %)'), '#ff0000', 'rgb percent spaced');
assertEq(normalizeRgbColor('rgb(101%, 0%, 0%)'), null, 'rgb percent range');
assertEq(normalizeColor('#f00'), '#ff0000', 'color helper hex');
assertEq(normalizeNamedColor('red'), '#ff0000', 'named red');
assertEq(normalizeNamedColor('RED'), '#ff0000', 'named red case');
assertEq(normalizeColor('blue'), '#0000ff', 'named blue');
assertEq(normalizeColor('grey'), '#808080', 'named grey');
assertEq(normalizeNamedColor('reddish'), null, 'partial name is not a color');
assertEq(normalizeNamedColor('rebeccapurple'), '#663399', 'named rebeccapurple');
assertEq(normalizeNamedColor('orangered'), '#ff4500', 'named orangered');
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
assertEq(paintSelectionIndex({type: 'window', title: 'Firefox', description: 'Workspace 1', id: 42, index: 0}, [
    {type: 'window', title: 'Firefox', description: 'Workspace 1', id: 7},
    {type: 'window', title: 'Firefox', description: 'Workspace 2', id: 42},
]), 1, 'window id keeps the same window');
assertEq(windowResultId(42, 'Firefox', 'Navigator', 'Workspace 1'), 42, 'mutter window id');
assertEq(windowResultId('', 'Firefox', 'Navigator', 'Workspace 1'), 'Firefox\0Navigator\0Workspace 1', 'fallback window id');
assertEq(firstSelectableIndex([
    {type: 'path', title: '~/docs', activatable: false},
    {type: 'path', title: 'Open in Terminal'},
]), 1, 'skip pending path on first paint');
assertEq(resultSelectionKey({type: 'window', title: 'Firefox', id: 42}, 1).id, 42, 'selection key keeps id');
const pendingThenReady = [
    {type: 'path', title: '~/docs', activatable: false, activate: () => {}},
    {type: 'path', title: 'Open in Terminal', activate: () => {}},
];
assertEq(activatableResult(pendingThenReady, 0).title, 'Open in Terminal', 'enter skips checking path');
assertEq(activatableResult([
    {type: 'path', title: '~/docs', activatable: false, activate: () => {}},
], 0), null, 'only pending stays closed');
assert(commandIsReady(expandHomePath('./ls', '/bin'), () => null, path => path === '/bin/ls'), 'home-relative ready');
assertEq(commandRowMeta('ls', true).description, 'Run command', 'ready command copy');
assertEq(commandRowMeta('nope', false).description, 'Command not found', 'missing command copy');
assertEq(commandRowMeta('~/bin/true', false, true).description, 'Checking command', 'pending command copy');
assertEq(commandRowMeta('~/bin/true', false, true).activatable, false, 'pending command not activatable');
assertEq(commandRowMeta('missing', false).activatable, false, 'missing command not activatable');
assert(!resultCanActivate(commandRowMeta('ls', false, true)), 'pending command cannot activate');

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
assertEq(shortcutAttempts('<Super>space').join(','), '<Super>space,<Control>space,<Alt>space', 'failed grab falls back');
assertEq(shortcutAttempts('<Control>space').join(','), '<Control>space,<Super>space,<Alt>space', 'default tries other modifiers');
assertEq(shortcutAttempts('').join(','), '<Control>space,<Super>space,<Alt>space', 'empty requested uses default then fallbacks');
assert(isNavAction('move'), 'move is nav');
assert(!isNavAction('propagate'), 'propagate is not nav');

// rename leftovers in source
assertEq(metadata.uuid.includes('spotlight'), false, 'uuid is not spotlight');
assert(schema.includes('org.gnome.shell.extensions.gosh-is-launcher'), 'schema id');

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0)
    process.exit(1);
