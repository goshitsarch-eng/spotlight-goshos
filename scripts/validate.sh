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

echo "schema"
glib-compile-schemas schemas/

echo "unit tests"
node tests/run.mjs

echo "uuid leftovers"
if grep -r "spotlight@ninx" . --exclude-dir=.git --exclude-dir=.github; then
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

echo "validate ok"
