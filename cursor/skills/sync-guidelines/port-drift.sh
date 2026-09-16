#!/usr/bin/env bash
# Report drift between ~/.claude and ~/.cursor, in BOTH directions.
#
# Porting is editorial, not mechanical. A Cursor copy differs from its Claude original
# on purpose: agent dispatch becomes sequential passes (Cursor has no Agent tool),
# cross-links go .md -> .mdc, toolchain names are generalised, anecdotes compressed.
# The two bodies never match, so comparing them says nothing.
#
# Each ported file therefore carries two hashes in its frontmatter:
#
#   portedFrom: <sha of the Claude source, as of the last port>
#   portedSelf: <sha of this file's own body, as of the last port>
#
# Which gives four states:
#
#   both match              clean
#   portedFrom differs      Claude moved on      -> forward-port  (claude -> cursor)
#   portedSelf differs      Cursor was edited    -> back-port     (cursor -> claude)
#   both differ             edited on both sides -> merge by hand, then restamp
#
# Nothing is ever overwritten: the rewriting is a human/model job, this only finds it.
#
#   port-drift.sh                  report both directions
#   port-drift.sh --apply          copy files that are new on one side and safe to copy
#   port-drift.sh --stamp <name>   restamp one skill or rule after porting it by hand
set -u

CLAUDE_SKILLS="$HOME/.claude/skills"; CURSOR_SKILLS="$HOME/.cursor/skills"
CLAUDE_RULES="$HOME/.claude/rules";   CURSOR_RULES="$HOME/.cursor/rules"

# Hash a file's content ignoring the stamp lines, so stamping never changes the hash.
sha_body() { grep -vE '^ported(From|Self): ' "$1" | tr -d '\r' | sha1sum | cut -c1-12; }

# Stamps live in the frontmatter block ONLY. A skill that documents the stamp format has
# those same keys in its body; reading the whole file would pick the example up as data.
frontmatter() { awk 'NR==1 && $0!~/^---/{exit} NR>1 && /^---/{exit} {print}' "$1"; }
stamp_key()  { [ -f "$1" ] && frontmatter "$1" | sed -n "s/^$2: //p" | head -1; }
stamp_of()   { stamp_key "$1" portedFrom; }
stamp_self() { stamp_key "$1" portedSelf; }

# write_stamp <ported-file> <source-file>
write_stamp() {
  local dst=$1 src=$2
  python - "$dst" "$(sha_body "$src")" "$(sha_body "$dst")" <<'PY'
import io,sys,re
p, src_sha, self_sha = sys.argv[1], sys.argv[2], sys.argv[3]
s = io.open(p, encoding='utf-8').read()
s = re.sub(r'^ported(From|Self): .*\n', '', s, flags=re.M)
i = s.index('---', 3)
s = s[:i] + 'portedFrom: %s\nportedSelf: %s\n' % (src_sha, self_sha) + s[i:]
io.open(p, 'w', encoding='utf-8', newline='').write(s)
PY
}

# Resolve a ported file to the Claude name it came from (its own, unless renamed).
claude_name_of() {
  local renamed; renamed=$(stamp_key "$1" portedFromFile)
  [ -n "$renamed" ] && { echo "$renamed"; return; }
  basename "$1" .mdc
}

if [ "${1:-}" = "--stamp" ]; then
  name=${2:?usage: --stamp <skill-name|rule-name>}
  if [ -f "$CLAUDE_SKILLS/$name/SKILL.md" ]; then
    write_stamp "$CURSOR_SKILLS/$name/SKILL.md" "$CLAUDE_SKILLS/$name/SKILL.md"
  elif [ -f "$CLAUDE_RULES/$name.md" ]; then
    target=$(grep -ls "^portedFromFile: $name\$" "$CURSOR_RULES"/*.mdc 2>/dev/null | head -1)
    [ -n "$target" ] || target="$CURSOR_RULES/$name.mdc"
    write_stamp "$target" "$CLAUDE_RULES/$name.md"
  else
    echo "no Claude source named '$name'" >&2; exit 1
  fi
  echo "restamped $name"
  exit 0
fi

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

# Text that cannot survive a verbatim copy in either direction.
MARKERS='subagent_type|sub-?agents?\b|Agent tool|allowed-tools:|~/\.claude|~/\.cursor|hook-content|Skill tool|\bskills?\b|\]\([^)]*\.mdc?\)|\bnx \b|\bng \b|vitest|storybook'
marked() { grep -rqiE "$MARKERS" "$1" 2>/dev/null; }

forward=(); backward=(); conflict=(); unstamped=(); copied=(); to_claude=(); to_cursor=()

# check_pair <claude-source> <cursor-port> <label>
check_pair() {
  local src=$1 dst=$2 label=$3 from self
  from=$(stamp_of "$dst"); self=$(stamp_self "$dst")
  # An independent sibling is not a port: both sides were written for their own harness,
  # and neither owes the other a rewrite. Declared as `portedFrom: independent`.
  [ "$from" = "independent" ] && return
  if [ -z "$from" ]; then unstamped+=("$label"); return; fi
  if [ -z "$self" ]; then
    # Stamped before portedSelf existed: Claude-side drift is still detectable.
    [ "$from" = "$(sha_body "$src")" ] || forward+=("$label")
    unstamped+=("$label (no portedSelf; restamp to arm back-port detection)")
    return
  fi
  local src_changed=0 dst_changed=0
  [ "$from" = "$(sha_body "$src")" ] || src_changed=1
  [ "$self" = "$(sha_body "$dst")" ] || dst_changed=1
  if   [ $src_changed = 1 ] && [ $dst_changed = 1 ]; then conflict+=("$label")
  elif [ $src_changed = 1 ]; then forward+=("$label")
  elif [ $dst_changed = 1 ]; then backward+=("$label")
  fi
}

for src in "$CLAUDE_SKILLS"/*/; do
  name=$(basename "$src"); dst="$CURSOR_SKILLS/$name"
  if [ ! -f "$src/SKILL.md" ]; then
    # A directory with no SKILL.md is a shared reference pool, not a skill.
    [ -d "$dst" ] || to_cursor+=("pool  $name (reference pool)")
    [ -d "$dst" ] && ! diff -qr "$src/references" "$dst/references" >/dev/null 2>&1 \
      && conflict+=("pool  $name references")
    continue
  fi
  if [ -d "$dst" ]; then
    check_pair "$src/SKILL.md" "$dst/SKILL.md" "skill $name"
  elif marked "$src"; then
    to_cursor+=("skill $name (hand-port)")
  else
    copied+=("skill $name -> cursor")
    [ "$APPLY" = 1 ] && cp -r "$src" "$dst" && write_stamp "$dst/SKILL.md" "$src/SKILL.md"
  fi
done

declare -A ported_rules=()
for f in "$CURSOR_RULES"/*.mdc; do ported_rules[$(claude_name_of "$f")]="$f"; done

for src in "$CLAUDE_RULES"/*.md; do
  name=$(basename "$src" .md); dst=${ported_rules[$name]:-}
  if [ -z "$dst" ]; then to_cursor+=("rule  $name (hand-port: needs .mdc frontmatter)")
  else check_pair "$src" "$dst" "rule  $name"; fi
done

# Cursor-side originals: nothing in Claude to compare against, so they are back-port candidates.
for dst in "$CURSOR_SKILLS"/*/; do
  n=$(basename "$dst"); [ -d "$CLAUDE_SKILLS/$n" ] || to_claude+=("skill $n")
done
for dst in "$CURSOR_RULES"/*.mdc; do
  n=$(claude_name_of "$dst")
  [ -f "$CLAUDE_RULES/$n.md" ] || to_claude+=("rule  $(basename "$dst" .mdc)")
done

section() { local t=$1; shift; [ "$#" -eq 0 ] && return; printf '\n%s (%d)\n' "$t" "$#"; printf '  %s\n' "$@"; }

[ "$APPLY" = 1 ] && echo "APPLY" || echo "REPORT ONLY (--apply copies only what is new on one side)"
section "forward-port needed: Claude moved on"        "${forward[@]+"${forward[@]}"}"
section "back-port needed: Cursor was edited"         "${backward[@]+"${backward[@]}"}"
section "edited on BOTH sides: merge, then --stamp"   "${conflict[@]+"${conflict[@]}"}"
section "copied"                                      "${copied[@]+"${copied[@]}"}"
section "absent from Cursor: hand-port"               "${to_cursor[@]+"${to_cursor[@]}"}"
section "Cursor-only: back-port to Claude or keep"    "${to_claude[@]+"${to_claude[@]}"}"
section "unstamped"                                   "${unstamped[@]+"${unstamped[@]}"}"
printf '\nNothing existing is overwritten. After porting a file by hand: --stamp <name>\n'
