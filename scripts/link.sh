#!/usr/bin/env bash
# Make this repo the source of truth for ~/.claude: symlink the synced
# paths into claude-code/ and install the 60s launchd autosync agent.
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

# launchd agent (macOS)
if [ "$(uname)" = "Darwin" ]; then
  LABEL="com.dvirmon.guidelines-sync"
  PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
  mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
  cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>$REPO/scripts/autosync.sh</string>
  </array>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>StartInterval</key><integer>60</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/guidelines-sync.log</string>
</dict></plist>
EOF
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST"
  echo "launchd agent $LABEL installed (every 60s)"
else
  echo "non-macOS: schedule 'bash $REPO/scripts/autosync.sh' every minute (cron/systemd/Task Scheduler)"
fi
