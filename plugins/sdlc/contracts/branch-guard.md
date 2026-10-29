# Branch guard

Which branch a stage is on, and whether it may commit there. Cited by `/implement`, `/review` and
`/ship`. Run it before touching git.

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

Say which check fired, and stop — never "just this once" on the default branch.
