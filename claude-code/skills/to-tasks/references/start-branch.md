<!-- Shared procedure. Cited by to-ticket, to-tasks, implement (fallback) and the epic
     archive chore. Edit here, never restate in a skill body. -->

# Start a branch (in its own worktree, by default)

One PR unit = one branch = one PR; what a unit is follows `prUnit` in
`conventions/doc-contracts/workflow-config.md`. Work never starts on the default branch. Every
branch starts from fresh `origin/<default>` — no stacked branches; a blocked issue waits until
its blocker's PR is merged.

`isolation` (same config) picks the shape:
- `worktree` (default) — the branch gets its own worktree; the calling skill enters it with
  `EnterWorktree`. Work never happens in the primary checkout.
- `branch` — the branch is checked out in place, in the primary checkout. No worktree is
  created and `worktreePath` is `null`.

## Input

- `branch` — the full branch name (see Naming). The caller decides it.
- `repoRoot` — the primary checkout (`git worktree list --porcelain`, first `worktree` entry).
- `isolation` — `worktree` · `branch`, from the merged workflow config.

## Naming

| Caller | Branch |
|---|---|
| `/to-ticket`, `prUnit: sub-issue` (epic planning docs) | `docs/<epic-slug>` |
| `/to-ticket`, `prUnit: ticket` (the ticket's one branch) | `<type>/<key>-<slug>` |
| `/to-tasks`, `/impel` fallback (one issue) | `<type>/<issue#>-<slice-slug>` |
| epic archive chore | `chore/<epic-slug>-archive` |

- `<slice-slug>` — the slug in the issue body's `<!-- slice: <epic-ref>/<slice-slug> -->`
  marker. No marker → kebab-case of the issue title, max 40 chars.
- `<type>` — one of the repo's branch-validator types (org:
  `tools/validate-branch-name.mjs`). Infer from the issue: a `bug` label or a fix-shaped
  title → `fix`; a pure restructure → `refactor`; docs-only → `docs`; tooling/config →
  `chore`/`ci`/`build`; otherwise `feat`. Say the inferred type in the report — renaming a
  branch before its first push is cheap.
- The whole name must match `^<type>/[a-z0-9][a-z0-9-]*$`.
- Worktree path (`isolation: worktree` only): `<repoRoot>/.claude/worktrees/<branch with "/" → "-">`, e.g.
  `.claude/worktrees/feat-105-delete-coupled-surface`.

## Procedure

### 1. Prune merged work

Run from `repoRoot`.

1. `git fetch --prune origin`.
2. Resolve the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` →
   `origin/<default>`. If it doesn't resolve, or it names a non-default branch, ask — don't
   guess.
3. For every worktree under `.claude/worktrees/` and every local branch other than
   `<default>`: check `gh pr list --state merged --head <branch> --json number --jq length`.
   - `≥ 1` (PR merged) → `git worktree remove <path>`, then `git branch -D <branch>`.
     Force-delete is required: a rebase-merge rewrites SHAs, so git never sees the branch as
     merged. It is safe only because the merged state was just confirmed on GitHub.
   - A worktree with uncommitted changes → skip it and report it. Never `--force` a worktree
     removal.
   - No PR, or PR open/closed-unmerged → leave it alone.
4. Fast-forward the default branch in the primary checkout:
   `git -C <repoRoot> pull --ff-only origin <default>` — only when the primary checkout is on
   `<default>` and clean. If it can't fast-forward, stop and report; never merge or reset.

Report what was pruned, one line per branch.

### 2. Create the branch

**`isolation: branch`** — no worktree:

1. If `branch` already exists → `git -C <repoRoot> switch <branch>`. Resuming is normal.
2. If the primary checkout is dirty, stop: name the files and ask the user to commit, stash or
   discard them.
3. `git -C <repoRoot> switch -c <branch> origin/<default>` — always from the fresh remote
   default, never from local HEAD.
4. Skip §3. Work stays in `repoRoot`.

**`isolation: worktree`:**

1. If `branch` already exists (local or `origin/<branch>`) and has a worktree → don't create
   anything; enter that worktree (step 3). Resuming is normal.
2. If the current tree (the one the session is in) is dirty, stop: name the files and ask the
   user to commit, stash or discard them. Don't carry changes across.
3. `git worktree add <path> -b <branch> origin/<default>` — always from the fresh remote
   default, never from local HEAD.
4. Confirm `.claude/worktrees/` is gitignored (`git check-ignore -q <path>`). If not, say so
   — the repo bootstrap in `/setup-skills` adds it; don't edit `.gitignore` from here.

### 3. Enter it (`isolation: worktree`)

`EnterWorktree` with `path: <path>`. Every later read, write, writer-agent brief (absolute
paths) and commit in the calling skill targets the worktree, not the primary checkout.

### 4. Dependencies

A fresh worktree has no `node_modules` (`isolation: branch` keeps the checkout's own; skip this). **Don't install.** Print the command for the user to
run (the repo's lockfile decides: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install
--immutable`), per `never-run-build-serve-test-unprompted`. A typecheck before that install
fails for reasons unrelated to the change — say so rather than debugging it.

## Output to the caller

`branch`, `worktreePath` (`null` when `isolation` is `branch`), the default branch name, and the
prune report. The caller records `branch` and `worktreePath` where its contract says
(`/to-tasks`: the unit's `units[].branch` / `.worktree` in `state.json`, and the `progress.md`
header).
