---
name: atomic-commit
description: Split all current changes (staged and/or unstaged) into multiple atomic commits, each scoped to a single responsibility/concern, instead of one big commit. Use when the user asks to commit current changes "in an SRP way", "atomically", "split into logical commits", or when `git diff HEAD` clearly mixes unrelated concerns (e.g. a feature change bundled with an unrelated fix, a refactor, or a formatting pass).
portedFrom: 3d7b3ab5911a
---

# Commit current changes (SRP)

Turn all current uncommitted changes in the working tree — staged or not — into a sequence of small, single-purpose commits instead of one mixed commit. Each resulting commit should do exactly one thing — a reviewer reading its diff and message shouldn't find any change that a different one-line summary would need to describe.

This only ever touches the **index** (staging area) and creates **new** commits. It never rewrites existing history, never discards or edits any file's contents, and never pushes.

## 1. Preconditions

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
- a commit message: **conventional commit format with emoji** in imperative mood, explains *why* not *what*, matches the repo's existing style pulled from `git log`. Format: `<emoji> <type>(scope): <description>` where emoji matches the commit type (e.g., `🎸 feat`, `🐛 fix`, `📚 docs`, `🎨 chore`, `🍎 ref`)

**Scope naming:** In monorepo/multi-domain repos, include the app/lib and domain path in the scope for clarity:
- `(app-name/domain/component)` — e.g., `(issa-landing/ds/card)`, `(issa-landing/sections/mission)`
- `(lib-name/domain)` — e.g., `(shared-ds/table)`, `(shared-ds/forms)`
- `(root)` — for root-level changes (settings, config, docs at repo level)
- Single-app/single-domain repos: just `(domain-or-component)` — e.g., `(button)`, `(homepage)`

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
   - Commit with a heredoc, following conventional commit format with emoji (message via heredoc, `Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>` trailer, no `--no-verify`, no `--amend`):
     ```bash
     git commit -m "$(cat <<'EOF'
     <emoji> <type>(scope): <description>

     <body if needed>

     Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
     EOF
     )"
     ```
     **Emoji reference:**
     - 🎸 `feat` — new feature
     - 🐛 `fix` — bug fix
     - 📚 `docs` — documentation
     - 🎨 `chore` — build/tooling/dependencies
     - 🍎 `ref` — code refactoring
     - ⚡ `perf` — performance improvement
     - ✅ `test` — test changes
     - 🔒 `security` — security fix
3. After the last bucket, verify nothing was lost or duplicated:
   - `git status` — working tree and index should be clean (no staged, unstaged, or untracked files left over).
   - `git diff <original-HEAD>..HEAD` should equal the saved `pre-split.patch` (same net change, now spread across commits).
   - If they don't match, do not force anything — report the discrepancy and offer to restore from `pre-split.patch` (`git apply --cached <path>` after a `git reset` back to `<original-HEAD>`, or `git reset --hard <original-HEAD>` only with explicit user confirmation since it's destructive).

## 5. Report

List the commits created (short SHA + subject, in order). Do not push — pushing is a separate, explicit request.
