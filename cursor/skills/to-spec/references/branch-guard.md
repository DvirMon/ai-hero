# Branch guard

Which branch a stage is on, and whether it may commit there. Cited by `/to-ticket`,
`/grill-with-docs`, `/to-spec`, `/to-issues`, `/to-tasks`, `/implement`, `/review`, `/ship`,
and `/setup`. Run it before touching git.

## Classify

The default branch is `git symbolic-ref --short refs/remotes/origin/HEAD` → `origin/<default>`.

| Branch | Kind |
|---|---|
| `<type>/<N>-<slug>` | **issue branch**, issue `#N` |
| `<type>/<key>-<slug>` (`prUnit: ticket`) | **issue branch**, the ticket `<key>` |
| `docs/<epic-slug>` | **planning branch** |
| `chore/<slug>`, every commit in `origin/<default>..HEAD` carrying `Refs: none` | **no-issue branch** |
| the default branch, detached HEAD, anything else | **stop** — renaming a branch is the developer's call |

## Guard

On an issue branch, also stop when:

- `progress.md` has a `**Branch:**` line and the current branch differs from it.
- `progress.md` has a `**Worktree:**` line and the session isn't inside that path. If the
  worktree exists, enter it (`EnterWorktree` with `path`) and re-check instead of stopping.
- There is no `progress.md` and the branch's `N` isn't this issue's.

Say which check fired, and stop — unless the user overrides, per § Override.

## Override

The guard stops by default. Do not infer a waiver, and do not grant yourself "just this once".

The user waives **this run** by saying so in the invoking message, or in the reply after a
stop: "override the branch guard", "work on this branch", or "proceed here".

Then name the check waived and the current branch, and continue the stage on that branch.
Do not start a different one. The next invocation stops again unless the user overrides again.

The waiver covers only the checks in this file (kind, `progress.md` branch, worktree). It does
not waive other preconditions, and it does not let `/ship` push or merge the default branch.
