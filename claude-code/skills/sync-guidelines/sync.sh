#!/usr/bin/env bash
# Mirror-only extras. CLAUDE.md, RTK.md, rules/, skills/, agents/ and
# conventions/ are symlinked into the repo (scripts/link.sh) and pushed
# by scripts/push.sh — they are not copied here.
set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
CURSOR_DIR="$HOME/.cursor"
# This file lives at <repo>/claude-code/skills/sync-guidelines/, reached
# through the ~/.claude/skills symlink; -P resolves to the real clone.
REPO_DIR="${GUIDELINES_REPO:-$(cd -P "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"

if [ ! -e "$REPO_DIR/.git" ]; then
  echo "error: $REPO_DIR is not a git repo. Clone it first: gh repo clone DvirMon/ai-hero $REPO_DIR" >&2
  exit 1
fi

mkdir -p "$REPO_DIR/claude-code" "$REPO_DIR/cursor"

# sync_dir SRC DEST [--exclude=X ...]
# Mirror SRC into DEST (delete extras, dereference symlinks). rsync when present, tar otherwise
# (Git Bash on Windows ships no rsync).
sync_dir() {
  local src="$1" dest="$2"; shift 2
  if command -v rsync >/dev/null 2>&1; then
    rsync -aL --delete "$@" "$src/" "$dest/"
  else
    rm -rf "$dest"
    mkdir -p "$dest"
    tar -C "$src" -ch "$@" -f - . | tar -C "$dest" -xf -
  fi
}

# --- Repo-level .claude/{skills,agents}: project-scoped on purpose (e.g. org's ds-*), ---
# --- kept out of ~/.claude so they don't leak into unrelated projects' context. ---
# --- Stored under claude-code/project/, NOT in the symlinked live dirs. ---
GIT_ROOT="$HOME/git"
if [ -d "$GIT_ROOT" ]; then
  for repo_claude in "$GIT_ROOT"/*/.claude; do
    [ -d "$repo_claude" ] || continue
    for sub in skills agents; do
      [ -d "$repo_claude/$sub" ] || continue
      mkdir -p "$REPO_DIR/claude-code/project/$sub"
      for item in "$repo_claude/$sub"/*; do
        [ -e "$item" ] || continue
        if command -v rsync >/dev/null 2>&1; then
          rsync -aL "$item" "$REPO_DIR/claude-code/project/$sub/"
        else
          cp -RL "$item" "$REPO_DIR/claude-code/project/$sub/"
        fi
      done
    done
  done
fi

# --- Installed plugin skills/agents/commands/docs only (not full plugin source) ---
PLUGIN_EXCLUDES=(--exclude='.git' --exclude='dist' --exclude='node_modules' --exclude='bin' \
  --exclude='tests' --exclude='benchmarks' --exclude='evals' --exclude='src' \
  --exclude='.github' --exclude='.changeset' --exclude='.codex' --exclude='.out-of-scope')

if [ -d "$CLAUDE_DIR/plugins/marketplaces" ]; then
  rm -rf "$REPO_DIR/claude-code/plugins"
  mkdir -p "$REPO_DIR/claude-code/plugins"
  for marketplace_dir in "$CLAUDE_DIR/plugins/marketplaces"/*/; do
    name="$(basename "$marketplace_dir")"
    # The mirror repo is itself a marketplace (plugins/*); its plugin
    # source lives in the repo already — never mirror it back.
    [ "$name" = "ai-hero" ] && continue
    dest="$REPO_DIR/claude-code/plugins/$name"
    mkdir -p "$dest"
    for sub in skills agents commands docs; do
      if [ -d "$marketplace_dir$sub" ]; then
        sync_dir "$marketplace_dir$sub" "$dest/$sub" "${PLUGIN_EXCLUDES[@]}"
      fi
    done
    find "$dest" -maxdepth 1 -type d -empty -delete 2>/dev/null || true
  done
  find "$REPO_DIR/claude-code/plugins" -maxdepth 1 -type d -empty -delete 2>/dev/null || true
fi

# --- Cursor: own personal skills (ported from Claude Code) ---
[ -d "$CURSOR_DIR/skills" ] && sync_dir "$CURSOR_DIR/skills" "$REPO_DIR/cursor/skills"

# --- Cursor: rules ---
[ -d "$CURSOR_DIR/rules" ] && sync_dir "$CURSOR_DIR/rules" "$REPO_DIR/cursor/rules"

bash "$REPO_DIR/scripts/check-denylist.sh"

echo "Extras mirrored. autosync commits claude-code/ within 60s; cursor/ needs a manual commit."
