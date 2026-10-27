#!/usr/bin/env bash
# Manual: commit local claude-code/ edits and push to master.
#   bash scripts/push.sh ["commit message"]
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
[ "$(git branch --show-current)" = "master" ] || { echo "not on master" >&2; exit 1; }
bash scripts/check-denylist.sh

if [ -n "$(git status --porcelain -- claude-code)" ]; then
  git add -A -- claude-code
  git commit -q -m "${1:-chore(sync): $(hostname -s) $(date '+%F %T')}" -- claude-code
fi

git pull --rebase --autostash -q origin master
git push -q origin master
echo "pushed: $(git log --oneline -1)"
