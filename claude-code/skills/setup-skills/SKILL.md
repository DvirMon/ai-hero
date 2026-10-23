---
name: setup-skills
description: Configure this repo for the engineering skills — set up its issue tracker, ticket tracker, triage label vocabulary, domain doc layout, and the PR-branch workflow enforcement (git hooks, commitlint, PR template, GitHub Actions, rulesets). Run once before first use of the other engineering skills. Covers the pipeline `/to-ticket` → `/grill-with-docs` → `/to-spec` → `/to-issues` → `/to-tasks` → `/impel` → `/ship`.
disable-model-invocation: true
---

# Setup Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — where engineering issues live (GitHub by default; local markdown is also supported out of the box)
- **Ticket tracker** — where intake tickets live, if `to-ticket` is installed (Jira, Linear, or local markdown)
- **Triage labels** — the strings used for the five canonical triage roles
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them
- **Branch workflow** — the enforcement for one issue = one branch = one PR, rebase-merge only: git hooks, commitlint, PR template, GitHub Actions, ruleset and repo settings

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub repo? Which one?
- `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does this skill's prior output already exist?
- `.scratch/` — sign that a local-markdown issue tracker convention is already in use
- Is the `to-ticket` skill installed? (a `to-ticket` skill folder alongside this one, or `to-ticket` in your available skills.) This decides whether Section B runs at all.
- Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section C runs at all.
- Hook mechanism — `.husky/` (and `"prepare": "husky"`), `.githooks/` (and `core.hooksPath`), or none. Also `commitlint.config.*`, `tools/validate-branch-name.*`, `.github/workflows/*`, `.github/pull_request_template.md`, `.gitignore` entry for `.claude/worktrees/`.
- Remote enforcement (read-only): `gh api repos/<o>/<r> --jq '{allow_merge_commit,allow_squash_merge,allow_rebase_merge,allow_auto_merge,delete_branch_on_merge,default_branch}'` and `gh api repos/<o>/<r>/rulesets`; `gh secret list` for `ANTHROPIC_API_KEY` / `PIPELINE_TOKEN`.
- Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order — one section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't installed, Section C when there's no monorepo).

**Section A — Issue tracker.**

> Explainer: The "issue tracker" is where engineering issues live for this repo. Skills like `to-issues`, `triage`, `to-spec`, and `qa` read from and write to it — they need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:

- **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab** — issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
- **Local markdown** — issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
- **Other** (Jira, Linear, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off** — leave it off and don't raise it; a user who wants external PRs in the triage queue can flip the flag in the file later.

There is no ship-mode question: every change goes through a PR (`CLAUDE.md` § Git workflow). If an existing `docs/agents/issue-tracker.md` still has a `## Ship mode` or `## Closing trailer` section, replace it with the template's `## Issue references` section.

**Section B — Ticket tracker.** Skip this section entirely if the `to-ticket` skill isn't installed (exploration told you) — an uninstalled skill needs no tracker.

> Explainer: The "ticket tracker" is where **intake** tickets live — the rough, product-level ask that starts the pipeline, before `/grill-with-docs` and `/to-spec` refine it into an engineering spec. This is deliberately separate from Section A's issue tracker: intake is often a different tool (Jira, Linear) than where engineering issues end up (GitHub), even though both can be the same tool if that's how this team works.

Offer:

- **Jira** — intake tickets live in a Jira project (REST API or an MCP server, whichever the user has available)
- **Linear** — intake tickets live in a Linear team (API or an MCP server)
- **Local markdown** — intake tickets live as files under `.scratch/tickets/` (good for solo projects, or before real tracker access is set up)
- **Other** — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

For Jira or Linear, also collect: base URL / workspace, project key or team, and auth method (an API token env var, or the name of an already-configured MCP server). Record the choice in `docs/agents/ticket-tracker.md`.

**Section C — Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you) — an uninstalled skill needs no labels.

If it is installed, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no — usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`) — collect the overrides so `triage` applies existing labels instead of creating duplicates.

**Section D — Domain docs.** Default to **single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. This fits almost every repo; write it without asking.

Offer **multi-context** — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files — only when exploration found monorepo signals. Then confirm which layout they want.

**Section E — Branch workflow bootstrap.** GitHub only (GitLab: point at the note in `issue-tracker-gitlab.md`; local/other: skip). Templates and their verified sources: [templates/README.md](./templates/README.md).

Build one change list from exploration, diffing each template against what exists — adapt, don't overwrite repo-specific content:

| Piece | Template | Target |
|---|---|---|
| Branch rule | `templates/tools/validate-branch-name.mjs` | `tools/validate-branch-name.mjs` (merge the type list with an existing one) |
| Hooks | `templates/hooks/pre-commit`, `pre-push` | `.husky/` when husky is present; `.githooks/` (+ `core.hooksPath` via the repo's `prepare` script) when that's the mechanism; none found → propose `.githooks/`. Append to an existing hook rather than replacing it; mark `.githooks/*` executable (`git update-index --chmod=+x`). |
| Commit format | `templates/commitlint.config.js` | root; add `@commitlint/cli` + `@commitlint/config-conventional` to devDependencies if missing (the user installs) |
| PR template | `templates/pull_request_template.md` | `.github/pull_request_template.md` |
| Actions | `templates/workflows/*.yml` | `.github/workflows/` — pin `uses:` by SHA; `pr-conventions.yml` supersedes a `commitlint.yml` / trailer-check job (remove those after confirm) |
| CI gate | `templates/snippets/ci-gate.yml` | merged into `ci.yml`, `needs:` = every job there; `ci.yml` must also run on `pull_request` |
| Worktrees | — | `.gitignore` gains `.claude/worktrees/` |
| Obsolete | — | `close-linked-issue-on-ci-green.yml` (and its helper scripts) deleted — `Closes #N` + merge closes the issue |
| Server | `templates/rulesets/main.json`, `templates/repo-settings.md` | `gh api` calls, in the order `repo-settings.md` gives |
| Secrets | — | list `ANTHROPIC_API_KEY`, `PIPELINE_TOKEN` as the user's to create (`gh secret set`) — never ask for or handle the values |

Show the full list — every file diff and every `gh api` command — and apply nothing until the user confirms. Confirm the server-side calls separately from the file edits: they change the remote repo and are visible to others. Never create the ruleset before the workflows exist on the default branch (required checks must have run once).

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (see step 4 for selection rules)
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and `docs/agents/triage-labels.md` (the last only when `triage` is installed)
- The contents of `docs/agents/ticket-tracker.md` (only when `to-ticket` is installed)
- The Section E change list (only when Section E ran)

Let them edit before writing.

These edits are themselves a change to the repo: make them on a branch (`chore/setup-skills`), never on the default branch, and ship them with `/ship`. The `gh api` server calls run after that PR merges.

### 4. Write

**Pick the file to edit:**

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask the user which one to create — don't pick for them.

Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa) — always edit the one that's already there.

If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Ticket tracker

[one-line summary of where intake tickets are tracked]. See `docs/agents/ticket-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout — "single-context" or "multi-context"]. See `docs/agents/domain.md`.
```

Include the `### Ticket tracker` sub-block, and write `docs/agents/ticket-tracker.md`, only when `to-ticket` is installed and Section B ran. Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section C ran. When either isn't, its sub-block and file are omitted.

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker
- [issue-tracker-jira.md](./issue-tracker-jira.md) — Jira sub-tasks under the intake ticket
- [ticket-tracker-jira.md](./ticket-tracker-jira.md) — Jira ticket tracker (only if `to-ticket` is installed)
- [ticket-tracker-linear.md](./ticket-tracker-linear.md) — Linear ticket tracker (only if `to-ticket` is installed)
- [ticket-tracker-local.md](./ticket-tracker-local.md) — local-markdown ticket tracker (only if `to-ticket` is installed)
- [triage-labels.md](./triage-labels.md) — label mapping (only if `triage` is installed)
- [domain.md](./domain.md) — domain doc consumer rules + layout

For "other" issue or ticket trackers, write the corresponding file from scratch using the user's description.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files. If Section E ran, list what is still theirs to do: install the new devDependencies, create the two secrets, and approve the `gh api` calls once the setup PR has merged. Mention they can edit `docs/agents/*.md` directly later — re-running this skill is only necessary if they want to switch trackers or restart from scratch.

The code-review config (`docs/agents/code-review.md`) is not written here — the `code-review` plugin owns it. Point the user to `/code-review:code-review init` if the repo has none.
