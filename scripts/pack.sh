#!/usr/bin/env bash
set -euo pipefail

# builds the ego-style zip from the repo root
# gschemas.compiled is left out because gnome 44+ compiles schemas on install
# https://gjs.guide/extensions/development/preferences.html#gsettings

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

name="gosh-is-launcher@nin"
zip="${name}.zip"
rm -f "$zip"

mapfile -t js < <(ls -1 *.js)
zip -q -r "$zip" \
  metadata.json \
  stylesheet.css \
  LICENSE \
  schemas/org.gnome.shell.extensions.gosh-is-launcher.gschema.xml \
  prefs \
  "${js[@]}"

echo "$zip"
unzip -l "$zip"
