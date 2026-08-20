import {evaluateArithmetic, formatNumber} from '../calculator.js';
import {parseQuery, PREFIXES} from '../prefixParser.js';
import {isUrlQuery, normalizeUrl} from '../urlMatch.js';
import {THEMES, getTheme, getThemeIds, applyLookSettings, iconSizeForLook} from '../themes.js';
import {SEARCH_ENGINES, getEngine} from '../webEngines.js';
import {getSectionTitle, getSectionTypes} from '../sectionTitles.js';
import {actionMatchesQuery} from '../actionMatch.js';
import {planSearch} from '../searchPlan.js';
import {wordPrefixMatch} from '../wordMatch.js';
import {matchSettingsPanels, SETTINGS_PANELS} from '../settingsPanels.js';
import {nextSelectedIndex} from '../selectionMath.js';
import {attachScrollChild, applyScrollPolicy, getVerticalAdjustment} from '../scrollView.js';
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

// urls
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

// catalogs stay aligned
const themeIds = getThemeIds();
assert(themeIds.includes('omarchy'), 'omarchy theme');
assert(themeIds.includes('popos'), 'popos theme');
assert(themeIds.includes('ulauncher'), 'ulauncher theme');
assert(themeIds.includes('krunner'), 'krunner theme');
assert(themeIds.includes('gnome'), 'gnome theme');
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

// rename leftovers in source
assertEq(metadata.uuid.includes('spotlight'), false, 'uuid is not spotlight');
assert(schema.includes('org.gnome.shell.extensions.gosh-is-launcher'), 'schema id');

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0)
    process.exit(1);
