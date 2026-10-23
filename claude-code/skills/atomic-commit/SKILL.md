---
name: atomic-commit
description: Split all current changes (staged and/or unstaged) into multiple atomic commits, each scoped to a single responsibility/concern, instead of one big commit. Use when the user asks to commit current changes "in an SRP way", "atomically", "split into logical commits", or when `git diff HEAD` clearly mixes unrelated concerns (e.g. a feature change bundled with an unrelated fix, a refactor, or a formatting pass).
---

# Commit current changes (SRP)

Turn all current uncommitted changes in the working tree — staged or not — into a sequence of small, single-purpose commits instead of one mixed commit. Each resulting commit should do exactly one thing — a reviewer reading its diff and message shouldn't find any change that a different one-line summary would need to describe.

This only ever touches the **index** (staging area) and creates **new** commits. It never rewrites existing history, never discards or edits any file's contents, and never pushes.

This skill is also the **commit-format SSOT** for the pipeline (§ Commit format). `/impel` writes its per-step commits in this format; this skill itself is the ad-hoc splitter for leftover or hand-made changes, not a step of the main flow.

## Commit format

**Per-repo override first.** Read `~/.config/org/commit-format.json`. If its
`repo` equals the current repo root, use its format for every commit made here:

- First commit on the branch: `subject` with `{issue}` and `{ticketTitle}`
  filled in, then the `firstCommit.body` fields (`Resolution Description`,
  `Testing Instructions`, `Reviewed By`).
- Later commits: `laterCommits.subject`, body optional.
- Skip the emoji/type/`Refs:` rules below for these commits.

Otherwise (another repo, or no file) use the default format:

```
<emoji> [#<issue> <stage>] <type>(<project>[/<domain>]): <imperative subject>

<body: why, not what — optional>

Refs: #N
Epic: #M
Co-Authored-By: <the exact line from this session's attribution reminder>
```

- **Types** — only commitlint `config-conventional` types, each with a fixed emoji:

  | Emoji | Type | For |
  |---|---|---|
  | 🎸 | `feat` | new feature |
  | 🐛 | `fix` | bug fix |
  | 🔒 | `fix` | security fix |
  | 🍎 | `ref` | refactor, no behavior change (`refactor` is a legacy alias — never emit it) |
  | ⚡ | `perf` | performance |
  | ✅ | `test` | tests only |
  | 📚 | `docs` | documentation |
  | 🎨 | `chore` | tooling, dependencies, housekeeping |
  | 📦 | `build` | build system |
  | 👷 | `ci` | CI config |
  | 💄 | `style` | formatting only |
  | ⏪ | `revert` | revert |

- **Story tag** `[#<issue> <stage>]` — optional. Stage `s<N>` = step N of `4-tasks/issue-<N>/step-<N>-*.plan.md`; `plan` = task/test plans; `review` = changes answering review. Omit for `Refs: none` work or commits that fit no stage. The tag's issue must also appear in `Refs:`.
- **Trailers** — `Refs: #N` for the issue the commit belongs to; `Epic: #M` when the epic is known; `Refs: none` when unrelated to any issue. If `docs/agents/issue-tracker.md` names a different partial trailer, use that name instead.
- **Never close from a commit.** No `Closes #N` / `Ships: #N` and no GitHub closing keyword (`close[sd]`, `fix(e[sd])`, `resolve[sd]` before `#N`) anywhere in the message — the PR body owns `Closes #N`.
- Imperative mood, subject explains *why* when it fits.
- Full rule (tag, scope, trailers, enforcement): `docs/agents/issue-tracker.md#issue-references` — link, don't restate.

## 1. Preconditions

- **Not on the default branch.** Resolve it (`git symbolic-ref --short refs/remotes/origin/HEAD`, strip `origin/`; fall back to `main`/`master`). If `git branch --show-current` equals it, stop: "commits go on a feature branch — start one first (see /to-tasks start-branch)". Never commit on the default branch.
- `git status` and `git diff HEAD --stat` (covers both staged and unstaged changes to tracked files). Also note any untracked files (`??` lines in `git status --porcelain`) — treat them as whole-file buckets. If there are no staged changes, no unstaged changes, and no untracked files, stop and tell the user.
- `git log --oneline -20` to pick up this repo's commit message style/conventions (and check `CLAUDE.md` / `CONTRIBUTING.md` for documented conventions).
- Save a safety copy of the full current diff before touching anything: `git diff HEAD > <scratchpad>/pre-split.patch`. This is the recovery path if anything goes wrong. (Untracked files aren't captured by this diff — `git reset` won't touch them anyway, so they're safe regardless.)

## 2. Partition into responsibilities

Read the full diff against HEAD (`git diff HEAD`, which includes anything already staged) plus `git diff HEAD --name-status`, and the untracked-file list from `git status --porcelain`. Group the changes into responsibility buckets. A bucket can span multiple files (SRP is about *concern*, not file count) but must not span concerns:

- **Whole-file groups** — a file is entirely one concern; it goes into one bucket wholesale.
- **Hunk-level groups** — a single file mixes unrelated hunks (e.g. an unrelated formatting fix sitting next to a logic change, or two unrelated features touching the same file). These need splitting below the file level.

**SRP heuristic: one commit = one reason to merge/revert**

Ask: "If a reviewer asks to undo this commit, what would they be undoing?" If the answer is one coherent change (not "this feature AND this config update"), the bucket is right-sized.

**Grouping rules:**
- **Same tool/framework config** — all TypeScript config changes, all npm script updates, all Storybook settings belong together (one reason changed the tool)
- **Project-scoped changes** — one app's configuration/setup stays together even if multiple files; different apps' configs are separate commits
- **Coupled dependencies** — new file + reference to it in same commit (they enable each other)
- **Infrastructure vs. code** — tooling/build/config changes separate from feature/fix logic

**Typical concern boundaries to split on:** feature vs. unrelated fix, logic change vs. pure formatting/rename, implementation vs. generated/lock files, one feature's plumbing vs. another's, test changes that belong with their own implementation change (keep these together, not as a separate "tests" bucket, unless the tests are genuinely orthogonal).

For each bucket, draft:
- files (and, for hunk-level buckets, which hunks — reference them by their `@@ -a,b +c,d @@` header)
- a commit message per § Commit format (emoji + type + scope, `Refs:`/`Epic:` trailers).

**Scope:** `<project>[/<domain>]` — `<project>` e.g. `table`, `root`, `deps`. `<domain>` is the one the work *belongs to*: the folder under `libs/table/docs/1-state/work/<domain>/` holding the issue's workspace, even if the diff touches other folders. No single owner → project only. Never a list. Repos without that layout: see `docs/agents/issue-tracker.md#issue-references`, else `(root)` / `(component)`.

Order buckets so the history reads sensibly (e.g. foundational/type changes before the code that uses them).

## 3. Confirm the plan

Show the user the bucket breakdown (files/hunks + draft message per commit) before touching the index. Skip this only if the user's request already made the grouping explicit (e.g. they dictated the exact commits). This is a good point to catch a miscategorized hunk before it's baked into history.

## 4. Execute

1. `git reset` — unstages everything (a no-op for anything that wasn't already staged), leaves the working tree untouched. After this, all tracked changes — originally staged or not — sit unstaged together, ready to be re-staged bucket by bucket.
2. For each bucket, in the agreed order:
   - **Whole-file bucket**: `git add <file> <file> ...`
   - **Hunk-level bucket**: `git restore --staged <file>` is already a no-op post-reset; instead drive `git add -p -- <file>` non-interactively. Diff the file first (`git diff -- <file>`) to see hunks in order, then feed one `y`/`n` per hunk via stdin, e.g.:
     ```bash
     printf 'y\nn\ny\n' | git add -p -- <file>
     ```
     If a single hunk itself mixes two concerns, answer `s` (split) at that prompt and continue with `y`/`n` for the resulting pieces; fall back to `e` (manual hunk edit) only if `s` can't separate them cleanly.
   - Verify the staged result matches the bucket's intent: `git diff --staged`.
   - Commit with a heredoc in § Commit format (the `Co-Authored-By:` line exactly as this session's system reminder specifies — the model varies per session, never hardcode one):
     ```bash
     git commit -m "$(cat <<'EOF'
     <emoji> [#N stage] <type>(<project>[/<domain>]): <description>

     <body if needed>

     Refs: #N
     Co-Authored-By: <the exact line from this session's attribution reminder>
     EOF
     )"
     ```
3. After the last bucket, verify nothing was lost or duplicated:
   - `git status` — working tree and index should be clean (no staged, unstaged, or untracked files left over).
   - `git diff <original-HEAD>..HEAD` should equal the saved `pre-split.patch` (same net change, now spread across commits).
   - If they don't match, do not force anything — report the discrepancy and offer to restore from `pre-split.patch` (`git apply --cached <path>` after a `git reset` back to `<original-HEAD>`, or `git reset --hard <original-HEAD>` only with explicit user confirmation since it's destructive).

## 5. Report

List the commits created (short SHA + subject, in order). Do not push — pushing and opening the PR is `/ship`.
