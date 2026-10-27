#!/usr/bin/env bash
# Fail when a file holds an org-internal term.
#   bash scripts/check-denylist.sh            # working tree, incl. untracked
#   bash scripts/check-denylist.sh --staged   # the index only (pre-commit)
# The list is never committed — it would publish the names it guards.
# Locally: ~/.config/ai-hero/denylist (one term per line, # comments,
# case-insensitive fixed strings). CI: the DENYLIST repo secret.
# A missing or empty list fails: an unchecked push is the leak itself.
# Hits print as file:line only, so no term reaches a log.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIST_FILE="${DENYLIST_FILE:-$HOME/.config/ai-hero/denylist}"
SCOPE=(--untracked)
[ "${1:-}" = "--staged" ] && SCOPE=(--cached)

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
  echo "error: no denylist at $LIST_FILE — create it (one org term per line)" >&2
  exit 1
fi

printf '%s\n' "$raw" | tr -d '\r' | grep -vE '^[[:space:]]*(#|$)' > "$patterns" || true
if [ ! -s "$patterns" ]; then
  echo "error: denylist has no terms — org-content check cannot run" >&2
  exit 1
fi

hits="$(git -C "$REPO" grep "${SCOPE[@]}" -nIi -F -f "$patterns" | cut -d: -f1,2 || true)"
if [ -n "$hits" ]; then
  echo "error: org-internal terms found (terms hidden):" >&2
  printf '%s\n' "$hits" | sed 's/^/  /' >&2
  exit 1
fi
echo "ok: no denylisted terms"
