# Never build, serve, install, or test unprompted

> **Enforced.** `hooks/command-guard.js` (PreToolUse) turns builds, dev
> servers, installs and suite/lint runs into a permission prompt.
> Scoped spec runs (one spec file, or a `-t`/`--testNamePattern`
> filter) are auto-allowed for `test-implementer`, and for
> `implementer` in the test-first green phase. Approving a command
> makes that **exact** command stop asking for the session; a
> different target, an added flag, or a new session prompts again.

Never run builds, dev servers, installs/scaffolds, or tests without
explicit confirmation: `npm install`/`ng new`, `nx build`/`ng build`,
`nx serve`/`ng serve`/`storybook dev`/`build-storybook`, `nx test`/
`vitest`/Playwright. Tests are explicitly included. Read-only
inspection (`ls`, `git status`, `npm view`, `cat`) is unaffected.

**Why:** the user controls when long-running or resource-heavy
processes start and runs them manually ("do not run the project by
yourself"). Unprompted `build-storybook`, `nx test` "to verify", and
`nx serve` (including killing/restarting it) were each interrupted.

**How to apply:** write the code, run cheap static checks that start
no process (`tsc --noEmit`, lint), then state what's worth verifying
and stop. Don't even *offer* to build/serve/test as a next step. If a
run seems necessary, ask first and wait for a clear yes — but ask is
the floor; not proposing it is the default.

**Narrow exception:** project scaffolding (`ng new`) was once
delegated explicitly for one session; treat any such carve-out as
scoped to that ask, not a standing default. Installs, builds, tests,
servers and benchmark runs stay manual-only.
