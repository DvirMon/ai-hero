#!/usr/bin/env bash
# Fail when a tracked or untracked file holds an org-internal term.
#   bash scripts/check-denylist.sh
# The list is never committed — it would publish the names it guards.
# Locally: ~/.config/ai-hero/denylist (one term per line, # comments,
# case-insensitive fixed strings). CI: the DENYLIST repo secret.
# Hits print as file:line only, so no term reaches a log.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIST_FILE="${DENYLIST_FILE:-$HOME/.config/ai-hero/denylist}"

patterns="$(mktemp)"
trap 'rm -f "$patterns"' EXIT

if [ -n "${DENYLIST:-}" ]; then
  raw="$DENYLIST"
elif [ -f "$LIST_FILE" ]; then
  raw="$(cat "$LIST_FILE")"
elif [ -n "${CI:-}" ]; then
  echo "error: DENYLIST secret is not set — org-content check cannot run" >&2
  exit 1
else
  echo "warning: no denylist at $LIST_FILE — org-content check skipped" >&2
  exit 0
fi

printf '%s\n' "$raw" | tr -d '\r' | grep -vE '^[[:space:]]*(#|$)' > "$patterns" || true
if [ ! -s "$patterns" ]; then
  echo "warning: denylist is empty — org-content check skipped" >&2
  exit 0
fi

hits="$(git -C "$REPO" grep --untracked -nIi -F -f "$patterns" | cut -d: -f1,2 || true)"
if [ -n "$hits" ]; then
  echo "error: org-internal terms found (terms hidden):" >&2
  printf '%s\n' "$hits" | sed 's/^/  /' >&2
  exit 1
fi
echo "ok: no denylisted terms"
