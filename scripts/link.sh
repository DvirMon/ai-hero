#!/usr/bin/env bash
# Make this repo the source of truth for ~/.claude: symlink the synced
# paths into claude-code/. Pushing is manual (push.sh); pulling happens
# on SessionStart (pull.sh, wired in ~/.claude/settings.json).
# Safe to re-run. Existing real files/dirs are moved to
# ~/.claude/backups/pre-sync-<timestamp>/ first, never deleted.
#   bash scripts/link.sh [--adopt]
# --adopt: first copy local content INTO the repo (local wins) — use on
# the machine whose ~/.claude is the newest copy.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE="$HOME/.claude"
BACKUP="$CLAUDE/backups/pre-sync-$(date +%Y%m%d-%H%M%S)"
ADOPT=false
[ "${1:-}" = "--adopt" ] && ADOPT=true

DIRS=(skills rules agents conventions)
FILES=(CLAUDE.md RTK.md)

mkdir -p "$CLAUDE" "$BACKUP"

link() {
  local name="$1" target="$REPO/claude-code/$1" path="$CLAUDE/$1"
  if [ -L "$path" ] && [ "$(readlink "$path")" = "$target" ]; then return; fi
  if [ -e "$path" ] || [ -L "$path" ]; then mv "$path" "$BACKUP/"; fi
  ln -s "$target" "$path"
  echo "linked $path -> $target"
}

if $ADOPT; then
  for d in "${DIRS[@]}"; do
    [ -d "$CLAUDE/$d" ] && [ ! -L "$CLAUDE/$d" ] || continue
    mkdir -p "$REPO/claude-code/$d"
    rsync -aL --delete "$CLAUDE/$d/" "$REPO/claude-code/$d/"
  done
  for f in "${FILES[@]}"; do
    [ -f "$CLAUDE/$f" ] && [ ! -L "$CLAUDE/$f" ] && cp "$CLAUDE/$f" "$REPO/claude-code/$f"
  done
fi

for d in "${DIRS[@]}"; do link "$d"; done
for f in "${FILES[@]}"; do link "$f"; done

# SessionStart hook -> pull.sh. Adds only this one entry to settings.json;
# idempotent, leaves every other setting untouched.
install_pull_hook() {
  command -v python3 >/dev/null 2>&1 || {
    echo "python3 not found: add a SessionStart hook running 'bash $REPO/scripts/pull.sh' to $CLAUDE/settings.json by hand"
    return
  }
  python3 -I - "$CLAUDE/settings.json" "bash \"$REPO/scripts/pull.sh\"" <<'PY'
import json, os, sys
path, cmd = sys.argv[1], sys.argv[2]
data = json.load(open(path)) if os.path.exists(path) else {}
entries = data.setdefault("hooks", {}).setdefault("SessionStart", [])
if any("scripts/pull.sh" in h.get("command", "") for e in entries for h in e.get("hooks", [])):
    print("SessionStart pull hook already present")
else:
    entries.append({"hooks": [{"type": "command", "command": cmd}]})
    json.dump(data, open(path, "w"), indent=2)
    print("added SessionStart pull hook to " + path)
PY
}
install_pull_hook
