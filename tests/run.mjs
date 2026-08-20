import {evaluateArithmetic, formatNumber} from '../calculator.js';
import {parseQuery, PREFIXES, isPrefixToken} from '../prefixParser.js';
import {isUrlQuery, normalizeUrl, hostOfQuery, schemeForHost} from '../urlMatch.js';
import {canOpenPopup, shouldCloseOnToggle} from '../popupGate.js';
import {THEMES, getTheme, getThemeIds, applyLookSettings, iconSizeForLook} from '../themes.js';
import {SEARCH_ENGINES, getEngine} from '../webEngines.js';
import {getSectionTitle, getSectionTypes} from '../sectionTitles.js';
import {actionMatchesQuery} from '../actionMatch.js';
import {planSearch, flagsFromSettings} from '../searchPlan.js';
import {wordPrefixMatch} from '../wordMatch.js';
import {matchSettingsPanels, SETTINGS_PANELS} from '../settingsPanels.js';
import {nextSelectedIndex} from '../selectionMath.js';
import {attachScrollChild, applyScrollPolicy, getVerticalAdjustment} from '../scrollView.js';
import {parseRecentXbel, basenameFromUri} from '../recentXbel.js';
import {resolveKeyAction, isNavAction} from '../keyAction.js';
import {firstCommandArg, commandUsesPathLookup, commandIsReady} from '../commandReady.js';
import {buildAccelerator, modifiersFromMask, normalizeAccelKey} from '../shortcutAccel.js';
import {collectSearchResults} from '../searchRun.js';
import {windowMatches, windowClassText} from '../windowMatch.js';
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
assertEq(formatNumber(0.1 + 0.2), '0.3', 'float rounding');
assertEq(formatNumber(-0), '0', 'negative zero');
assertEq(formatNumber(256), '256', 'integers stay integers');

// prefixes
assertEq(parseQuery('chrome').mode, 'all', 'plain query');
assertEq(parseQuery('= 2+2').mode, 'calculator', 'calc prefix');
assertEq(parseQuery('=2+2').query, '2+2', 'calc query strip');
assertEq(parseQuery('@ gnome').mode, 'web', 'web prefix');
assertEq(parseQuery('# wifi').mode, 'settings', 'settings prefix');
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

assert(canOpenPopup(false, false, false, false), 'idle can open');
assert(!canOpenPopup(true, false, false, false), 'open flag blocks');
assert(!canOpenPopup(false, true, false, false), 'visible blocks');
assert(!canOpenPopup(false, false, true, false), 'lock screen blocks');
assert(!canOpenPopup(false, false, false, true), 'greeter blocks');
assert(shouldCloseOnToggle(true, false), 'idle gap still toggles closed');
assert(shouldCloseOnToggle(false, true), 'visible toggles closed');
assert(!shouldCloseOnToggle(false, false), 'closed stays closed');

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
for (const type of ['app', 'calculator', 'window', 'system-action', 'settings', 'file', 'url', 'command', 'web'])
    assert(types.includes(type), `section type ${type}`);
assertEq(getSectionTitle('window'), 'Windows', 'window title');

assert(actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'loc'), 'action prefix');
assert(!actionMatchesQuery({title: 'Lock Screen', keywords: ['lock']}, 'firefox'), 'action miss');

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
assertEq(evaluateArithmetic('-(2+3)'), -5, 'unary minus on group');
assertEq(evaluateArithmetic('2^3*2'), 16, 'power before multiply');
assertEq(formatNumber(1.2300000000001), '1.23', 'trim float noise');

// word prefix
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
assert(matchSettingsPanels('wellbeing', 5).some(p => p.id === 'wellbeing'), 'wellbeing');
assert(matchSettingsPanels('wireless', 5).some(p => p.id === 'wifi'), 'wifi keyword');
assert(matchSettingsPanels('a11y', 5).some(p => p.id === 'universal-access'), 'a11y keyword');
assert(SETTINGS_PANELS.length >= 20, 'enough settings panels');

// selection wrap vs page clamp
assertEq(nextSelectedIndex(0, -1, 5), 4, 'arrow wrap up');
assertEq(nextSelectedIndex(4, 1, 5), 0, 'arrow wrap down');
assertEq(nextSelectedIndex(0, 5, 3), 2, 'page down clamps');
assertEq(nextSelectedIndex(2, -5, 3), 0, 'page up clamps');
assertEq(nextSelectedIndex(0, 1, 0), -1, 'empty list');

// search plan feature flags
const allOn = {
    prefixModes: true, url: true, apps: true, calculator: true,
    windows: true, system: true, settings: true, files: true,
    command: true, web: true,
};
assertEq(planSearch('=2+2', allOn).mode, 'calculator', 'plan calc prefix');
assertEq(planSearch('=2+2', allOn).providers.join(','), 'calculator', 'plan calc only');
assertEq(planSearch('@cats', allOn).providers.join(','), 'web', 'plan web prefix');
assertEq(planSearch('chrome', allOn).mode, 'all', 'plan all');
assert(planSearch('chrome', allOn).webFallback, 'web fallback armed');
assert(planSearch('chrome', allOn).providers.includes('apps'), 'apps in all');
const noCalc = Object.assign({}, allOn, {calculator: false});
assertEq(planSearch('=2+2', noCalc).providers.length, 0, 'disabled calc prefix');
const noPrefix = Object.assign({}, allOn, {prefixModes: false});
assertEq(planSearch('=2+2', noPrefix).mode, 'all', 'prefix disabled');
const appsOnly = {
    prefixModes: false, url: false, apps: true, calculator: false,
    windows: false, system: false, settings: false, files: false,
    command: false, web: false,
};
assertEq(planSearch('x', appsOnly).providers.join(','), 'apps', 'apps only');
assert(!planSearch('x', appsOnly).webFallback, 'web off');
const windowsFirst = Object.assign({}, allOn, {resultOrder: 'windows-first'});
assertEq(planSearch('term', windowsFirst).providers.indexOf('windows') <
    planSearch('term', windowsFirst).providers.indexOf('apps'), true, 'windows before apps');
assertEq(planSearch('term', allOn).providers.indexOf('apps') <
    planSearch('term', allOn).providers.indexOf('windows'), true, 'apps before windows');

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

assert(windowMatches('Firefox', 'Navigator', 'fire'), 'title match');
assert(windowMatches('Notes', 'org.gnome.TextEditor', 'texted'), 'class match');
assert(windowMatches('Any', 'x', ''), 'empty query matches windows');
assert(!windowMatches('Firefox', 'Navigator', 'chrome'), 'window miss');
assertEq(windowClassText('Firefox', 'Navigator', 'org.mozilla.firefox'), 'Firefox Navigator org.mozilla.firefox', 'class text');

const stored = {};
applyLookSettings({
    set_string(key, value) {
        stored[key] = value;
    },
    set_boolean(key, value) {
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
}, getTheme('albert'));
assertEq(stored['show-section-headers'], true, 'albert keeps headers');
assertEq(iconSizeForLook(getTheme('raycast').look, 'comfortable') >
    iconSizeForLook(getTheme('albert').look, 'comfortable'), true, 'raycast icons larger than albert');

for (const theme of THEMES)
    assert(theme.look && theme.look.position && theme.look.resultOrder && theme.look.iconSize, `look profile ${theme.id}`);

assert(iconSizeForLook(getTheme('popos').look, 'comfortable') > iconSizeForLook(getTheme('krunner').look, 'comfortable'), 'popos icons larger than krunner');
assert(iconSizeForLook(getTheme('popos').look, 'compact') > iconSizeForLook(getTheme('krunner').look, 'compact'), 'compact still keeps look icon scale');
assertEq(iconSizeForLook({iconSize: 40}, 'compact'), 32, 'compact is 80 percent');
assertEq(iconSizeForLook({iconSize: 28}, 'comfortable'), 28, 'comfortable keeps size');

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
assert(css.includes('border-left: 3px solid #7aa2f7'), 'omarchy walker selected edge');
assert(css.includes('caret-color: #ff6363'), 'raycast red caret');
assert(css.includes('background-color: #1d99f3'), 'albert selected row');
assert(!css.includes('.spotlight-'), 'no leftover spotlight classes');

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
assertEq(parseRecentXbel('').length, 0, 'empty xbel');

assertEq(resolveKeyAction('Tab', false, false, false).delta, 1, 'tab down');
assertEq(resolveKeyAction('Tab', true, false, false).delta, -1, 'shift tab up');
assertEq(resolveKeyAction('ISO_Left_Tab', false, false, false).delta, -1, 'iso left tab');
assertEq(resolveKeyAction('Escape', false, false, false).type, 'close', 'escape');
assertEq(resolveKeyAction('Home', false, false, false).delta, -999, 'home to first');
assertEq(resolveKeyAction('End', false, false, false).delta, 999, 'end to last');
assertEq(nextSelectedIndex(3, -999, 6), 0, 'home clamps to first');
assertEq(nextSelectedIndex(1, 999, 6), 5, 'end clamps to last');
assertEq(resolveKeyAction('3', false, true, true).index, 2, 'alt 3');
assertEq(resolveKeyAction('3', false, true, false).type, 'propagate', 'alt 3 without hints');
assertEq(resolveKeyAction('a', false, false, false).type, 'propagate', 'letters propagate');

assertEq(firstCommandArg([]), '', 'empty argv');
assertEq(firstCommandArg(['ls', '-la']), 'ls', 'first arg');
assert(commandUsesPathLookup('ls'), 'bare name uses PATH');
assert(!commandUsesPathLookup('/bin/ls'), 'absolute skips PATH');
assert(!commandUsesPathLookup('./tool'), 'relative slash skips PATH');
assert(commandIsReady('ls', name => name === 'ls' ? '/bin/ls' : null, () => false), 'path lookup hit');
assert(!commandIsReady('nope', () => null, () => false), 'missing on PATH');
assert(commandIsReady('/bin/ls', () => null, path => path === '/bin/ls'), 'absolute exists');
assert(!commandIsReady('/no/such', () => '/bin/true', () => false), 'absolute missing');

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
const mods = modifiersFromMask(0b101, {super: 1, control: 4, shift: 2, alt: 8, meta: 16});
assert(mods.super && mods.control && !mods.shift, 'mask bits');
assert(isNavAction('move'), 'move is nav');
assert(!isNavAction('propagate'), 'propagate is not nav');

// rename leftovers in source
assertEq(metadata.uuid.includes('spotlight'), false, 'uuid is not spotlight');
assert(schema.includes('org.gnome.shell.extensions.gosh-is-launcher'), 'schema id');

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0)
    process.exit(1);
