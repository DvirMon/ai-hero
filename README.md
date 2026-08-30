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

## Sync

Source of truth is local (`~/.claude`, `~/.cursor`). This repo is a read-mostly mirror, updated
manually via the `sync-guidelines` Claude Code skill:

```
/sync-guidelines
```

Runs `~/.claude/skills/sync-guidelines/sync.sh`, then review + commit + push manually.
