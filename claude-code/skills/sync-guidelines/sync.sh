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

# --- Claude Code: root instruction files ---
cp "$CLAUDE_DIR/CLAUDE.md" "$REPO_DIR/claude-code/CLAUDE.md"
[ -f "$CLAUDE_DIR/RTK.md" ] && cp "$CLAUDE_DIR/RTK.md" "$REPO_DIR/claude-code/RTK.md"

# --- Claude Code: rules ---
rsync -a --delete "$CLAUDE_DIR/rules/" "$REPO_DIR/claude-code/rules/"

# --- Claude Code: own skills (dereference symlinks into .agents/skills) ---
rsync -aL --delete "$CLAUDE_DIR/skills/" "$REPO_DIR/claude-code/skills/"

# --- Claude Code: agents ---
rsync -a --delete "$CLAUDE_DIR/agents/" "$REPO_DIR/claude-code/agents/"

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
        rsync -a "${PLUGIN_EXCLUDES[@]}" "$marketplace_dir$sub/" "$dest/$sub/"
      fi
    done
    # drop empty dest dirs (marketplace had none of the above)
    find "$dest" -maxdepth 1 -type d -empty -delete 2>/dev/null || true
  done
  find "$REPO_DIR/claude-code/plugins" -maxdepth 1 -type d -empty -delete 2>/dev/null || true
fi

# --- Cursor: own personal skills (ported from Claude Code) ---
if [ -d "$CURSOR_DIR/skills" ]; then
  rsync -a --delete "$CURSOR_DIR/skills/" "$REPO_DIR/cursor/skills/"
fi

# --- Cursor: built-in skills-cursor (Cursor's own bundled skills, mirrored read-only) ---
if [ -d "$CURSOR_DIR/skills-cursor" ]; then
  rsync -a --delete --exclude='.sync-manifest.json' "$CURSOR_DIR/skills-cursor/" "$REPO_DIR/cursor/skills-cursor/"
fi

# --- Cursor: rules ---
if [ -d "$CURSOR_DIR/rules" ]; then
  rsync -a --delete "$CURSOR_DIR/rules/" "$REPO_DIR/cursor/rules/"
fi

echo "Sync complete. Review with: cd $REPO_DIR && git status"
