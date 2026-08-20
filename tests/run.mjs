import {evaluateArithmetic, formatNumber} from '../calculator.js';
import {parseQuery, PREFIXES} from '../prefixParser.js';
import {isUrlQuery, normalizeUrl} from '../urlMatch.js';
import {THEMES, getTheme, getThemeIds} from '../themes.js';
import {SEARCH_ENGINES, getEngine} from '../webEngines.js';
import {getSectionTitle, getSectionTypes} from '../sectionTitles.js';
import {actionMatchesQuery} from '../actionMatch.js';
import {readFileSync} from 'node:fs';

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
assert(!isUrlQuery('chrome'), 'plain word is not a url');
assert(!isUrlQuery('hello world'), 'spaces are not a url');
assertEq(normalizeUrl('example.com'), 'https://example.com', 'add https');
assertEq(normalizeUrl('https://ok.test'), 'https://ok.test', 'keep scheme');

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

console.log(`${passed} passed, ${failed} failed`);
if (failed > 0)
    process.exit(1);
