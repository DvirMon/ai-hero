#!/usr/bin/env bash
# Bidirectional sync for claude-code/: commit local edits, rebase onto
# origin, push. Run on a timer (see scripts/link.sh). On conflict it
# aborts, notifies, and stays halted until `autosync.sh --resume`.
set -uo pipefail

REPO="${GUIDELINES_REPO:-$HOME/repos/ai-coding-guidelines}"
cd "$REPO" || exit 1

GIT_DIR_PATH="$(git rev-parse --git-dir)"
LOCK="$GIT_DIR_PATH/autosync.lock"
HALT="$GIT_DIR_PATH/autosync.halt"

notify() {
  echo "autosync: $1" >&2
  osascript -e "display notification \"$1\" with title \"guidelines sync\"" 2>/dev/null || true
}

halt() {
  git rebase --abort 2>/dev/null || true
  echo "$1" > "$HALT"
  notify "$1 — fix in $REPO, then run scripts/autosync.sh --resume"
  exit 1
}

if [ "${1:-}" = "--resume" ]; then rm -f "$HALT"; fi
[ -f "$HALT" ] && exit 0
[ "$(git branch --show-current)" = "master" ] || exit 0

mkdir "$LOCK" 2>/dev/null || exit 0
trap 'rmdir "$LOCK"' EXIT

if [ -n "$(git status --porcelain -- claude-code)" ]; then
  git add -A -- claude-code
  git commit -q -m "chore(sync): $(hostname -s) $(date '+%F %T')" -- claude-code \
    || halt "commit failed"
fi

git pull --rebase --autostash -q origin master || halt "rebase conflict"

if [ "$(git rev-list --count origin/master..HEAD)" -gt 0 ]; then
  git push -q origin master || halt "push failed"
fi
