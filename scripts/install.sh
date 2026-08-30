#!/usr/bin/env bash
# Portable installer for this repo's guidelines onto a new/other local machine.
# Usage:
#   bash scripts/install.sh                # interactive
#   bash scripts/install.sh --harness=claude-code
#   bash scripts/install.sh --harness=cursor
#   bash scripts/install.sh --harness=all
#   bash scripts/install.sh --harness=all --yes-plugins   # non-interactive, imports all mirrored plugins too
#
# Scope: CLAUDE.md/RTK.md, rules/, skills/, agents/ only.
# Plugins are NEVER auto-installed — always asked one at a time (or skipped
# entirely unless --yes-plugins is passed for scripted/CI use).
# Never touches settings.json, mcp.json, or any credentials — this repo
# doesn't contain them and this script won't create or copy them.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HARNESS=""
YES_PLUGINS=false

for arg in "$@"; do
  case "$arg" in
    --harness=*) HARNESS="${arg#--harness=}" ;;
    --yes-plugins) YES_PLUGINS=true ;;
    *) echo "unknown arg: $arg" >&2; exit 1 ;;
  esac
done

if [ -z "$HARNESS" ]; then
  echo "Which harness do you want to install into?"
  echo "  1) claude-code  (~/.claude)"
  echo "  2) cursor       (~/.cursor)"
  echo "  3) all"
  read -r -p "Choice [1-3]: " choice
  case "$choice" in
    1) HARNESS="claude-code" ;;
    2) HARNESS="cursor" ;;
    3) HARNESS="all" ;;
    *) echo "invalid choice" >&2; exit 1 ;;
  esac
fi

copy_file_with_confirm() {
  local src="$1" dest="$2"
  if [ ! -f "$src" ]; then return; fi
  if [ -f "$dest" ] && ! diff -q "$src" "$dest" >/dev/null 2>&1; then
    read -r -p "$dest already exists and differs. Overwrite with repo version? [y/N] " ans
    [ "$ans" = "y" ] || [ "$ans" = "Y" ] || { echo "skipped $dest"; return; }
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo "installed $dest"
}

install_claude_code() {
  local dest="$HOME/.claude"
  echo "--- claude-code -> $dest ---"
  copy_file_with_confirm "$REPO_DIR/claude-code/CLAUDE.md" "$dest/CLAUDE.md"
  copy_file_with_confirm "$REPO_DIR/claude-code/RTK.md" "$dest/RTK.md"

  [ -d "$REPO_DIR/claude-code/rules" ] && rsync -a "$REPO_DIR/claude-code/rules/" "$dest/rules/" && echo "synced rules/"
  [ -d "$REPO_DIR/claude-code/skills" ] && rsync -a "$REPO_DIR/claude-code/skills/" "$dest/skills/" && echo "synced skills/"
  [ -d "$REPO_DIR/claude-code/agents" ] && rsync -a "$REPO_DIR/claude-code/agents/" "$dest/agents/" && echo "synced agents/"
  [ -d "$REPO_DIR/claude-code/conventions" ] && rsync -a "$REPO_DIR/claude-code/conventions/" "$dest/conventions/" && echo "synced conventions/ (opt-in, not auto-loaded — pull into a project's CLAUDE.md when it fits)"

  install_claude_code_plugins "$dest"
}

install_claude_code_plugins() {
  local dest="$1"
  local plugins_dir="$REPO_DIR/claude-code/plugins"
  [ -d "$plugins_dir" ] || return
  echo "--- mirrored plugin skills (static copy, NOT a live plugin install) ---"
  for plugin_dir in "$plugins_dir"/*/; do
    local name; name="$(basename "$plugin_dir")"
    local do_install=false
    if [ "$YES_PLUGINS" = true ]; then
      do_install=true
    else
      read -r -p "Import mirrored plugin '$name' (skills/agents/commands/docs) into $dest? This is a static snapshot, not a managed install — for live updates use 'claude plugin marketplace add' instead. [y/N] " ans
      [ "$ans" = "y" ] || [ "$ans" = "Y" ] && do_install=true
    fi
    if [ "$do_install" = true ]; then
      for sub in skills agents commands docs; do
        [ -d "$plugin_dir$sub" ] && rsync -a "$plugin_dir$sub/" "$dest/$sub/"
      done
      echo "imported $name"
    else
      echo "skipped $name"
    fi
  done
}

install_cursor() {
  local dest="$HOME/.cursor"
  echo "--- cursor -> $dest ---"
  [ -d "$REPO_DIR/cursor/rules" ] && rsync -a "$REPO_DIR/cursor/rules/" "$dest/rules/" && echo "synced rules/"
  [ -d "$REPO_DIR/cursor/skills" ] && rsync -a "$REPO_DIR/cursor/skills/" "$dest/skills/" && echo "synced skills/"
  # skills-cursor/ is Cursor's own built-in bundle, not ours to install — intentionally skipped.
}

case "$HARNESS" in
  claude-code) install_claude_code ;;
  cursor) install_cursor ;;
  all) install_claude_code; install_cursor ;;
  *) echo "unknown harness: $HARNESS (expected claude-code, cursor, or all)" >&2; exit 1 ;;
esac

echo "Done."
