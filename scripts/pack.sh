#!/usr/bin/env bash
set -euo pipefail

# builds the ego-style zip with the stdlib so ci does not need the zip cli
# gschemas.compiled is left out because gnome 44+ compiles schemas on install
# https://gjs.guide/extensions/development/preferences.html#gsettings

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

python3 - <<'PY'
import pathlib
import zipfile

root = pathlib.Path('.')
name = 'gosh-is-launcher@nin.zip'
files = [
    root / 'metadata.json',
    root / 'stylesheet.css',
    root / 'LICENSE',
    root / 'schemas' / 'org.gnome.shell.extensions.gosh-is-launcher.gschema.xml',
]
files.extend(sorted(root.glob('*.js')))
files.extend(sorted((root / 'prefs').glob('*.js')))

with zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED) as zf:
    for path in files:
        zf.write(path, path.as_posix())
    names = zf.namelist()

print(name)
for n in names:
    print(n)
print(f'{len(names)} files')
PY
