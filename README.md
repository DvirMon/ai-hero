# ai-coding-guidelines

General, non-project-specific code-generation guidelines mirrored from local AI coding
harnesses. Not tied to any single codebase — file organization conventions, doc conventions,
review rules, skills, subagent definitions.

## Structure

```
claude-code/
├── CLAUDE.md, RTK.md   — root instructions (always-on, every project)
├── rules/              — always-on behavioral rules (auto-loaded every project)
├── conventions/        — opt-in, project-dependent conventions (NOT auto-loaded — pull into
│                          a project's own CLAUDE.md when it fits, e.g. file/doc organization
│                          patterns that don't suit every repo)
├── skills/             — own skills (symlinks dereferenced); skills/synced/ is
│                          Claude Code's claude.ai skill cache, gitignored
├── agents/             — subagent definitions
├── statusline.js       — status line script (settings.json `statusLine` runs it)
└── plugins/<name>/     — installed plugin skills/agents/commands/docs (source excluded)

cursor/
├── rules/              — includes both alwaysApply: true (always-on) and alwaysApply: false
│                          (opt-in, attach manually per project) rules — Cursor supports this
│                          distinction natively in each .mdc file's frontmatter
└── skills/             — own skills, ported from claude-code/skills

plugins/                — plugins authored HERE (source of truth), not mirrored
└── code-review/        — impact-ranked code review: orchestrator skill + reviewer agents
.claude-plugin/
└── marketplace.json    — makes this repo a plugin marketplace

scripts/
├── link.sh             — symlink ~/.claude paths into claude-code/, wire pull.sh
├── pull.sh             — fast-forward pull; runs from the SessionStart hook
├── push.sh             — commit claude-code/ edits and push
└── install.sh          — copy-based install (no symlinks), any harness
```

Not mirrored: `~/.cursor/skills-cursor/` — Cursor's own built-in skill bundle, ships with every
Cursor install automatically, not authored by you.

## Live sync across machines (Claude Code)

This repo is the source of truth for `~/.claude`. On each machine, `~/.claude/{CLAUDE.md,
RTK.md, statusline.js, rules, skills, agents, conventions}` are symlinks into `claude-code/`, so
edits are live. `settings.json` is not synced: each machine sets its own `statusLine` entry.
Pushing is manual; pulling is automatic at session start. No background job, no polling.

### Set up a new machine

```bash
gh auth login   # the repo is private; skip if already authenticated
gh repo clone DvirMon/ai-coding-guidelines ~/git/ai-coding-guidelines
bash ~/git/ai-coding-guidelines/scripts/link.sh
```

Any clone path works: scripts locate the repo from their own location.
Set `GUIDELINES_REPO` only to point them somewhere else.

`link.sh` is idempotent and does everything:
- moves any existing real files/dirs to `~/.claude/backups/pre-sync-<timestamp>/` (never deletes)
- symlinks the paths above into `claude-code/`
- adds a `SessionStart` hook to `~/.claude/settings.json` that runs `scripts/pull.sh`
  (the only change it makes to `settings.json`)

Add `--adopt` only on the machine whose `~/.claude` is the newest copy: it copies local content
into the repo first (local wins, deletes repo-only files).

Windows: symlinks need Developer Mode; otherwise use `scripts/install.sh` below.

### Day to day

| Action | Command |
|---|---|
| Publish local edits | `bash scripts/push.sh ["message"]` (from the clone) |
| Receive edits | automatic: `scripts/pull.sh` runs when a Claude Code session starts |
| Pull right now | `bash scripts/pull.sh` (from the clone) |

`push.sh` commits only `claude-code/`, rebases onto `origin/master` and pushes to `master`.
`pull.sh` is a fast-forward pull; it warns (never force-merges) on unpushed commits or conflicts.

## Mirror-only extras (local → repo)

Plugins, project-level skills (`~/git/*/.claude/{skills,agents}` → `claude-code/project/`) and
Cursor (`~/.cursor`) are not symlinked. The `sync-guidelines` skill copies them in via
`~/.claude/skills/sync-guidelines/sync.sh`; review, commit and push those by hand.

```
/sync-guidelines
```

## Install (repo → a new/other local machine, copy mode)

One-time copy instead of symlinks (Windows, or Cursor). No live sync afterwards.

```bash
git clone https://github.com/DvirMon/ai-coding-guidelines.git
cd ai-coding-guidelines
bash scripts/install.sh                       # interactive: pick claude-code / cursor / all
bash scripts/install.sh --harness=claude-code # non-interactive
bash scripts/install.sh --harness=all --yes-plugins  # also imports mirrored plugin skills, no prompts
```

Installs `CLAUDE.md`/`RTK.md`, `rules/`, `conventions/`, `skills/`, `agents/` for the chosen
harness(es). `conventions/` is copied but never auto-applied — same opt-in contract as on the
source machine.

**Plugins are never auto-installed.** `claude-code/plugins/<name>/` is a static, partial mirror
(skills/agents/commands/docs only — source/build trees excluded) of installed marketplace
plugins. The installer asks per plugin before copying anything from it, and copying it in is a
one-time snapshot, not a live-updating install — for that, use
`claude plugin marketplace add <repo>` instead.

## Own plugins (`plugins/`)

Unlike everything above, `plugins/` is authored in this repo — it is the source, not a mirror,
and `sync.sh` skips this repo's own marketplace so it is never copied back into
`claude-code/plugins/`. Install:

```bash
claude plugin marketplace add DvirMon/ai-coding-guidelines   # or a local clone's path
claude plugin install code-review@ai-coding-guidelines
```

Never touches `settings.json`, `mcp.json`, or credentials — not in this repo, not copied by the
installer.
