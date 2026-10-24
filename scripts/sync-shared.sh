#!/usr/bin/env bash
# Copy each shared plugin file from its source to its copies. A plugin
# can't read outside its own root, so a file two plugins need lives in
# the plugin that owns its contract and is copied into the others.
# Map: scripts/shared-files.json — { "<source>": ["<copy>", ...] },
# paths relative to the repo root. Edit the source, never a copy.
#   bash scripts/sync-shared.sh          # write the copies
#   bash scripts/sync-shared.sh --check  # exit 1 if a copy differs (CI)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAP="$REPO/scripts/shared-files.json"
CHECK=false
[ "${1:-}" = "--check" ] && CHECK=true

drift=0
while IFS=$'\t' read -r src copy; do
  if [ ! -f "$REPO/$src" ]; then
    echo "missing source: $src (named in scripts/shared-files.json)" >&2
    exit 2
  fi
  if cmp -s "$REPO/$src" "$REPO/$copy"; then continue; fi
  if $CHECK; then
    echo "drift: $copy differs from $src" >&2
    drift=1
  else
    mkdir -p "$(dirname "$REPO/$copy")"
    cp "$REPO/$src" "$REPO/$copy"
    echo "synced $copy <- $src"
  fi
done < <(jq -r 'to_entries[] | .key as $s | .value[] | [$s, .] | @tsv' "$MAP")

if [ "$drift" -ne 0 ]; then
  echo "run: bash scripts/sync-shared.sh" >&2
  exit 1
fi
