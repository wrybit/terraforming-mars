#!/usr/bin/env bash
# Copies the Dune pictures from the mockup into the game (assets/themes/dune/graphics).
#
# Why: the mockup (tm.baiz.org/terraforming-dune, folder _outputs/terraforming-dune) is where the pictures are drawn;
# its generator (tools/export-graphics.py) writes them to assets/graphics/*.svg. The game uses the same files under
# the same names (src/themes/dune/graphics.json maps the Mars pictures onto them), so a sync is a plain copy.
# Never edit the copies in the game – change the mockup, run its export, then this script.
#
#   scripts/sync-dune-graphics.sh [mockup folder]
#
# Reports new, changed and missing files; files only the game has are kept (and listed).
set -euo pipefail

MOCKUP="${1:-$HOME/Library/CloudStorage/Dropbox/Me/Apps/Terraforming_Mars/_outputs/terraforming-dune}"
SOURCE="$MOCKUP/assets/graphics"
TARGET="$(cd "$(dirname "$0")/.." && pwd)/assets/themes/dune/graphics"

if [ ! -d "$SOURCE" ]; then
  echo "No mockup pictures in $SOURCE – pass the mockup folder as the first argument." >&2
  exit 1
fi

added=0
changed=0
for file in "$SOURCE"/*.svg; do
  name="$(basename "$file")"
  if [ ! -f "$TARGET/$name" ]; then
    cp "$file" "$TARGET/$name"
    echo "new:     $name"
    added=$((added + 1))
  elif ! cmp -s "$file" "$TARGET/$name"; then
    cp "$file" "$TARGET/$name"
    echo "changed: $name"
    changed=$((changed + 1))
  fi
done

for file in "$TARGET"/*.svg; do
  name="$(basename "$file")"
  [ -f "$SOURCE/$name" ] || echo "only in the game (kept): $name"
done

echo "$added new, $changed changed"
