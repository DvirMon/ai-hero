# ai-coding-guidelines

General, non-project-specific code-generation guidelines mirrored from local AI coding
harnesses. Not tied to any single codebase — file organization conventions, doc conventions,
review rules, skills, subagent definitions.

## Structure

```
claude-code/
├── CLAUDE.md, RTK.md   — root instructions
├── rules/              — always-on behavioral rules
├── skills/             — own skills (symlinks dereferenced)
├── agents/             — subagent definitions
└── plugins/<name>/     — installed plugin skills/agents/commands/docs (source excluded)

cursor/
└── skills-cursor/      — Cursor skills (mostly built-in; custom rules land in cursor/rules/)
```

## Sync (local → repo)

Source of truth is local (`~/.claude`, `~/.cursor`). This repo is a read-mostly mirror, updated
manually via the `sync-guidelines` Claude Code skill:

```
/sync-guidelines
```

Runs `~/.claude/skills/sync-guidelines/sync.sh`, then review + commit + push manually.

## Install (repo → a new/other local machine)

```bash
git clone https://github.com/DvirMon/ai-coding-guidelines.git
cd ai-coding-guidelines
bash scripts/install.sh                       # interactive: pick claude-code / cursor / all
bash scripts/install.sh --harness=claude-code # non-interactive
bash scripts/install.sh --harness=all --yes-plugins  # also imports mirrored plugin skills, no prompts
```

Installs `CLAUDE.md`/`RTK.md`, `rules/`, `skills/`, `agents/` for the chosen harness(es).

**Plugins are never auto-installed.** `claude-code/plugins/<name>/` is a static, partial mirror
(skills/agents/commands/docs only — source/build trees excluded) of installed marketplace
plugins. The installer asks per plugin before copying anything from it, and copying it in is a
one-time snapshot, not a live-updating install — for that, use
`claude plugin marketplace add <repo>` instead.

Never touches `settings.json`, `mcp.json`, or credentials — not in this repo, not copied by the
installer.
