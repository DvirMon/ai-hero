#!/usr/bin/env bash
set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
CURSOR_DIR="$HOME/.cursor"
REPO_DIR="$HOME/repos/ai-coding-guidelines"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "error: $REPO_DIR is not a git repo. Clone it first: gh repo clone DvirMon/ai-coding-guidelines $REPO_DIR" >&2
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

# --- Claude Code: root instruction files ---
cp "$CLAUDE_DIR/CLAUDE.md" "$REPO_DIR/claude-code/CLAUDE.md"
[ -f "$CLAUDE_DIR/RTK.md" ] && cp "$CLAUDE_DIR/RTK.md" "$REPO_DIR/claude-code/RTK.md"

# --- Claude Code: rules ---
sync_dir "$CLAUDE_DIR/rules" "$REPO_DIR/claude-code/rules"

# --- Claude Code: own skills (dereference symlinks into .agents/skills) ---
sync_dir "$CLAUDE_DIR/skills" "$REPO_DIR/claude-code/skills"

# --- Claude Code: agents ---
sync_dir "$CLAUDE_DIR/agents" "$REPO_DIR/claude-code/agents"

# --- Claude Code: repo-level .claude/{skills,agents}, merged into the ---
# --- same global folders above (no --delete: these add to, never wipe, ---
# --- what ~/.claude already provided). Covers project-scoped skills/agents ---
# --- (e.g. org's ds-*) that are intentionally kept out of ~/.claude so ---
# --- they don't leak into unrelated projects' context, but should still ---
# --- be preserved in this mirror. ---
GIT_ROOT="$HOME/git"
if [ -d "$GIT_ROOT" ]; then
  for repo_claude in "$GIT_ROOT"/*/.claude; do
    [ -d "$repo_claude" ] || continue
    for sub in skills agents; do
      [ -d "$repo_claude/$sub" ] || continue
      for item in "$repo_claude/$sub"/*; do
        [ -e "$item" ] || continue
        name="$(basename "$item")"
        if command -v rsync >/dev/null 2>&1; then
          rsync -aL "$item" "$REPO_DIR/claude-code/$sub/"
        else
          rm -rf "$REPO_DIR/claude-code/$sub/$name"
          cp -rL "$item" "$REPO_DIR/claude-code/$sub/$name"
        fi
      done
    done
  done
fi

# --- Claude Code: opt-in / project-dependent conventions (NOT auto-loaded, unlike rules/) ---
[ -d "$CLAUDE_DIR/conventions" ] && sync_dir "$CLAUDE_DIR/conventions" "$REPO_DIR/claude-code/conventions"

# --- Claude Code: installed plugin skills/agents/commands/docs only (not full plugin source) ---
PLUGIN_EXCLUDES=(--exclude='.git' --exclude='dist' --exclude='node_modules' --exclude='bin' \
  --exclude='tests' --exclude='benchmarks' --exclude='evals' --exclude='src' \
  --exclude='.github' --exclude='.changeset' --exclude='.codex' --exclude='.out-of-scope')

if [ -d "$CLAUDE_DIR/plugins/marketplaces" ]; then
  rm -rf "$REPO_DIR/claude-code/plugins"
  mkdir -p "$REPO_DIR/claude-code/plugins"
  for marketplace_dir in "$CLAUDE_DIR/plugins/marketplaces"/*/; do
    name="$(basename "$marketplace_dir")"
    dest="$REPO_DIR/claude-code/plugins/$name"
    mkdir -p "$dest"
    for sub in skills agents commands docs; do
      if [ -d "$marketplace_dir$sub" ]; then
        sync_dir "$marketplace_dir$sub" "$dest/$sub" "${PLUGIN_EXCLUDES[@]}"
      fi
    done
    # drop empty dest dirs (marketplace had none of the above)
    find "$dest" -maxdepth 1 -type d -empty -delete 2>/dev/null || true
  done
  find "$REPO_DIR/claude-code/plugins" -maxdepth 1 -type d -empty -delete 2>/dev/null || true
fi

# --- Cursor: own personal skills (ported from Claude Code) ---
if [ -d "$CURSOR_DIR/skills" ]; then
  sync_dir "$CURSOR_DIR/skills" "$REPO_DIR/cursor/skills"
fi

# --- Cursor: rules ---
if [ -d "$CURSOR_DIR/rules" ]; then
  sync_dir "$CURSOR_DIR/rules" "$REPO_DIR/cursor/rules"
fi

echo "Sync complete. Review with: cd $REPO_DIR && git status"
