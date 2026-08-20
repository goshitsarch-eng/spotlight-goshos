#!/usr/bin/env bash
set -euo pipefail

# installs the same files pack.sh ships so tests scripts and docs stay out
# of the uuid directory ego rejects shipping those

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

uuid='gosh-is-launcher@nin'
dest="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/$uuid"

bash scripts/pack.sh >/dev/null

python3 - "$dest" <<'PY'
import pathlib
import shutil
import sys
import zipfile

dest = pathlib.Path(sys.argv[1])
archive = pathlib.Path('gosh-is-launcher@nin.zip')

if dest.exists():
    shutil.rmtree(dest)
dest.mkdir(parents=True)

with zipfile.ZipFile(archive) as zf:
    zf.extractall(dest)

print(dest)
PY

glib-compile-schemas "$dest/schemas/"
echo "installed $dest"
