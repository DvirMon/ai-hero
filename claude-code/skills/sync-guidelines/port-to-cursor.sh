#!/usr/bin/env bash
# Report drift between ~/.claude and ~/.cursor, and copy the few files safe to copy.
#
# Porting is editorial, not mechanical. A Cursor copy differs from its Claude original
# on purpose: sub-agent dispatch becomes sequential passes (Cursor has no Agent tool),
# cross-links go .md -> .mdc, toolchain names (nx, ng, vitest) are generalised, and
# anecdotes are compressed. So the two bodies never match and comparing them says
# nothing.
#
# Instead each ported file records, in its frontmatter, the hash of the Claude source
# it was ported FROM:
#
#   portedFrom: 26254db4683f          # sha1 of the source, first 12 chars
#   portedFromFile: route-discovery-to-agent   # only when the port was renamed
#
# Drift is that hash no longer matching the current source. Re-stamp after every
# hand-port, or the file reports as drifted forever.
#
#   port-to-cursor.sh            report only
#   port-to-cursor.sh --apply    additionally copy new, marker-free skills
#   port-to-cursor.sh --stamp <claude-rule-name> <cursor-file.mdc>
set -u

CLAUDE_SKILLS="$HOME/.claude/skills"; CURSOR_SKILLS="$HOME/.cursor/skills"
CLAUDE_RULES="$HOME/.claude/rules";   CURSOR_RULES="$HOME/.cursor/rules"

src_sha()      { tr -d '\r' < "$1" | sha1sum | cut -c1-12; }
stamp_of()     { [ -f "$1" ] && sed -n 's/^portedFrom: //p' "$1" | head -1; }
stamp_source() { [ -f "$1" ] && sed -n 's/^portedFromFile: //p' "$1" | head -1; }

# --stamp: record the current source hash on a file you just hand-ported.
if [ "${1:-}" = "--stamp" ]; then
  rule=${2:?usage: --stamp <claude-rule-name> <cursor-file.mdc>}
  target=${3:?usage: --stamp <claude-rule-name> <cursor-file.mdc>}
  [ -f "$target" ] || target="$CURSOR_RULES/$target"
  sha=$(src_sha "$CLAUDE_RULES/$rule.md")
  sed -i "/^portedFrom: /d" "$target"
  sed -i "0,/^---$/{s/^---$/---\nportedFrom: $sha/}" "$target"
  echo "stamped $target <- $rule ($sha)"
  exit 0
fi

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

# Text that cannot survive a verbatim copy into Cursor. Deliberately broad: a false
# positive costs one hand-port, a false negative ships Cursor an instruction to use a
# tool it does not have.
MARKERS='subagent_type|sub-?agents?\b|Agent tool|allowed-tools:|~/\.claude|hook-content|Skill tool|\bskills?\b|\]\([^)]*\.md\)|\bnx \b|\bng \b|vitest|storybook'
marked() { grep -rqiE "$MARKERS" "$1" 2>/dev/null; }

# Which Claude rule a Cursor file claims to come from (its own name unless renamed).
claude_name_of() {
  local f=$1 renamed
  renamed=$(stamp_source "$f")
  [ -n "$renamed" ] && { echo "$renamed"; return; }
  basename "$f" .mdc
}

copied=(); stale=(); unstamped=(); missing=(); orphaned=()
declare -A ported_rules=()
for f in "$CURSOR_RULES"/*.mdc; do ported_rules[$(claude_name_of "$f")]="$f"; done

for src in "$CLAUDE_SKILLS"/*/; do
  name=$(basename "$src"); dst="$CURSOR_SKILLS/$name"
  # A directory with no SKILL.md is a shared reference pool, not a skill. Cursor cannot
  # symlink one, so its port is a hand-written wrapper; compare the pooled files only.
  if [ ! -f "$src/SKILL.md" ]; then
    [ -d "$dst" ] || missing+=("pool  $name (hand-port: reference pool)")
    [ -d "$dst" ] && ! diff -qr "$src/references" "$dst/references" >/dev/null 2>&1       && stale+=("pool  $name references")
    continue
  fi
  if [ -d "$dst" ]; then
    stamp=$(stamp_of "$dst/SKILL.md")
    if [ -n "$stamp" ]; then
      [ "$stamp" = "$(src_sha "$src/SKILL.md")" ] || stale+=("skill $name")
    elif ! diff -qr "$src" "$dst" >/dev/null 2>&1; then
      unstamped+=("skill $name")
    fi
  elif marked "$src"; then
    missing+=("skill $name (hand-port: Claude-specific text)")
  else
    copied+=("skill $name")
    [ "$APPLY" = 1 ] && cp -r "$src" "$dst"
  fi
done

for src in "$CLAUDE_RULES"/*.md; do
  name=$(basename "$src" .md); dst=${ported_rules[$name]:-}
  if [ -z "$dst" ]; then
    # Even a marker-free rule needs description/globs/alwaysApply written by hand.
    missing+=("rule  $name (hand-port: needs .mdc frontmatter)")
    continue
  fi
  stamp=$(stamp_of "$dst")
  if [ -z "$stamp" ]; then unstamped+=("rule  $name")
  elif [ "$stamp" != "$(src_sha "$src")" ]; then stale+=("rule  $name -> $(basename "$dst")")
  fi
done

for dst in "$CURSOR_SKILLS"/*/; do
  n=$(basename "$dst"); [ -d "$CLAUDE_SKILLS/$n" ] || orphaned+=("skill $n")
done
for dst in "$CURSOR_RULES"/*.mdc; do
  n=$(claude_name_of "$dst")
  [ -f "$CLAUDE_RULES/$n.md" ] || orphaned+=("rule  $(basename "$dst" .mdc)")
done

section() { local t=$1; shift; [ "$#" -eq 0 ] && return; printf '\n%s (%d)\n' "$t" "$#"; printf '  %s\n' "$@"; }

[ "$APPLY" = 1 ] && echo "APPLY" || echo "REPORT ONLY (--apply copies the 'safe to copy' set)"
section "safe to copy: new, no Claude-specific text" "${copied[@]+"${copied[@]}"}"
section "drifted: source changed since the port"     "${stale[@]+"${stale[@]}"}"
section "unstamped: diff by hand, then --stamp"      "${unstamped[@]+"${unstamped[@]}"}"
section "absent from Cursor: hand-port"              "${missing[@]+"${missing[@]}"}"
section "in Cursor only: stale or renamed"           "${orphaned[@]+"${orphaned[@]}"}"
printf '\nNothing existing is ever overwritten.\n'
