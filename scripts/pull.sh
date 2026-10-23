#!/usr/bin/env bash
# Pull the latest guidelines. Silent on success; run from the
# SessionStart hook, so it never polls and costs no tokens.
set -uo pipefail

REPO="${GUIDELINES_REPO:-$HOME/repos/ai-coding-guidelines}"
cd "$REPO" 2>/dev/null || exit 0
[ "$(git branch --show-current)" = "master" ] || exit 0

git pull --ff-only --autostash -q origin master \
  || echo "guidelines pull failed (unpushed commits or conflict): resolve in $REPO or run scripts/push.sh" >&2
exit 0
