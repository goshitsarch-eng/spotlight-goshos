#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

echo "metadata.json"
python3 -c "import json; json.load(open('metadata.json'))"

echo "js syntax"
for f in *.js prefs/*.js tests/*.mjs; do
  node --check "$f"
done

if command -v gjs >/dev/null; then
  echo "gjs module parse"
  python3 - <<'PY'
import json, pathlib, subprocess, sys
files = list(pathlib.Path('.').glob('*.js')) + list(pathlib.Path('prefs').glob('*.js'))
for path in files:
    source = path.read_text()
    script = f"Reflect.parse({json.dumps(source)}, {{target: 'module'}})"
    result = subprocess.run(['gjs', '-c', script], capture_output=True, text=True)
    if result.returncode != 0:
        print(f'GJS PARSE ERROR {path}')
        print(result.stderr or result.stdout)
        sys.exit(1)
print(f'gjs parsed {len(files)} modules')
PY
fi

echo "schema"
glib-compile-schemas schemas/

echo "unit tests"
node tests/run.mjs

if command -v gjs >/dev/null; then
  echo "gjs scrollview helpers"
  gjs -m tests/gjs-scrollview.mjs
  echo "gjs command helpers"
  gjs -m tests/gjs-command.mjs
fi

echo "uuid leftovers"
if grep -r "spotlight@ninx" --include='*.js' --include='*.md' --include='*.json' --include='*.xml' --include='*.css' .; then
  echo "found spotlight@ninx"
  exit 1
fi

echo "version-name"
python3 - <<'PY'
import json
name = json.load(open("metadata.json"))["version-name"]
if len(name) > 16:
    raise SystemExit(f"version-name too long: {name}")
print(name)
PY

echo "optional chaining"
if grep -rnE '\?\.' *.js prefs/*.js; then
  echo "optional chaining is forbidden"
  exit 1
fi

echo "deprecated imports"
if grep -rn "imports.misc.lang\|imports.misc.mainloop\|imports.misc.byteArray" *.js prefs/*.js; then
  echo "deprecated imports"
  exit 1
fi

echo "process isolation"
if grep -rn "from 'gi://St'\|from 'gi://Clutter'\|from 'gi://Meta'\|from 'gi://Shell'" prefs/ prefs.js; then
  echo "prefs imported a shell library"
  exit 1
fi
if grep -rn "from 'gi://Gtk'\|from 'gi://Gdk'\|from 'gi://Adw'" *.js | grep -v "^prefs"; then
  echo "shell imported a gtk library"
  exit 1
fi

echo "css comments"
if grep -n '^\s*//' stylesheet.css; then
  echo "css // comments are invalid in st"
  exit 1
fi

echo "gnome 50 removed apis"
if grep -rn "RunDialog\|_restart\|holdKeyboard\|releaseKeyboard\|Meta.Rectangle" *.js prefs/*.js; then
  echo "found gnome 50 removed api"
  exit 1
fi

echo "constructor orientation"
if grep -rn "orientation: Clutter.Orientation" *.js; then
  echo "do not set orientation in constructors"
  exit 1
fi

echo "scrollview 48 api"
if grep -n "get_vscroll_bar" *.js prefs/*.js | grep -v '^scrollView.js:'; then
  echo "get_vscroll_bar was removed in gnome 48 use scrollView.js"
  exit 1
fi

echo "old popup file"
if [[ -e spotlightPopup.js ]]; then
  echo "spotlightPopup.js should have been renamed"
  exit 1
fi

echo "old schema file"
if [[ -e schemas/org.gnome.shell.extensions.spotlight.gschema.xml ]]; then
  echo "old schema still present"
  exit 1
fi

echo "install docs"
if grep -nE 'cp -r \*' README.md CONTRIBUTING.md; then
  echo "docs must not copy the repo tree into the uuid"
  exit 1
fi
if [[ ! -x scripts/install.sh ]]; then
  echo "scripts/install.sh must be executable"
  exit 1
fi

echo "install script"
install_home="$(mktemp -d)"
XDG_DATA_HOME="$install_home" bash scripts/install.sh >/tmp/gosh-install.out
python3 - "$install_home" <<'PY'
import pathlib
import sys

root = pathlib.Path(sys.argv[1]) / 'gnome-shell/extensions/gosh-is-launcher@nin'
if not (root / 'extension.js').is_file():
    raise SystemExit('install missing extension.js')
if not (root / 'schemas/org.gnome.shell.extensions.gosh-is-launcher.gschema.xml').is_file():
    raise SystemExit('install missing schema')
names = {path.name for path in root.iterdir()}
for banned in ('tests', 'scripts', 'README.md', '.github', 'CONTRIBUTING.md'):
    if banned in names:
        raise SystemExit(f'install shipped {banned}')
print(f'install extracted {len(list(root.rglob("*")))} paths')
PY
rm -rf "$install_home"

echo "pack zip"
bash scripts/pack.sh >/tmp/gosh-pack.out
python3 - <<'PY'
import zipfile
z = zipfile.ZipFile('gosh-is-launcher@nin.zip')
names = z.namelist()
required = [
    'metadata.json',
    'extension.js',
    'stylesheet.css',
    'prefs/appearancePage.js',
    'schemas/org.gnome.shell.extensions.gosh-is-launcher.gschema.xml',
    'gioLaunch.js',
    'commandReady.js',
    'shortcutAccel.js',
    'prefsCombo.js',
    'popupGate.js',
    'popupPosition.js',
    'backdropBox.js',
    'searchRun.js',
    'windowMatch.js',
    'windowClose.js',
    'workspaceQuery.js',
    'appMatch.js',
    'appAction.js',
    'unitMatch.js',
    'placeMatch.js',
    'bookmarkParse.js',
    'timeMatch.js',
    'colorMatch.js',
    'paintSelection.js',
    'asyncPaint.js',
    'focusLoss.js',
    'labelEllipsize.js',
    'scrollView.js',
    'entryPreedit.js',
    'homePath.js',
    'userPath.js',
    'pathSearch.js',
    'pathMatch.js',
    'resultPointer.js',
    'resultActivate.js',
    'appReady.js',
    'terminalLaunch.js',
]
missing = [n for n in required if n not in names]
if missing:
    raise SystemExit(f'zip missing {missing}')
if any(n.endswith('gschemas.compiled') for n in names):
    raise SystemExit('zip must not ship gschemas.compiled')
if any(n.startswith('tests/') or n.startswith('.github/') for n in names):
    raise SystemExit('zip contains development files')
print(f'zip has {len(names)} files')
PY

echo "validate ok"
