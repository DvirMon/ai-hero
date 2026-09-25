# Never build, serve, install, or test unprompted

> **Enforced, not advisory.** `hooks/command-guard.js` (PreToolUse) turns builds, dev servers,
> installs and suite/lint runs into a permission prompt, so you approve each one. Scoped
> spec runs (one spec file, or a `-t`/`--testNamePattern` filter) are auto-allowed for
> `test-implementer`, and for `angular-implementer`/`react-implementer` in the test-first
> green phase.
> Approving a command makes that **exact** command stop asking for the rest of the
> session — a different target, an added flag, or a new session prompts again.

Never run builds, dev servers, installs/scaffolds, or tests without explicit confirmation first
— this covers `npm install`/`ng new`/scaffold commands, `nx build`/`ng build`, `nx serve`/`ng serve`/
`storybook dev`/`build-storybook`, and `nx test`/`vitest`/Playwright runs. Running tests is
explicitly included, not treated as a safe exception. Read-only inspection (`ls`, `git status`,
`npm view`, `cat`) is unaffected — this is about mutating/installing/running actions.

**Why:** the user wants control over when long-running or resource-heavy processes start in their
environment, and runs these themselves. Stated repeatedly across projects after unprompted runs
were interrupted mid-task or called out as wasted effort: an unprompted `build-storybook` run
interrupted mid-task; unprompted `nx test` "to verify" after a refactor; unprompted `nx serve`
(including killing/restarting it hunting for a free port); an `npx @angular/cli new` scaffold call
stopped mid-session ("do not run the project by yourself. All scripts running and building of the
projects are always doing manually by me").

**How to apply:** Write the code, run cheap static checks that don't start a process
(`tsc --noEmit`, lint), then state what's worth verifying and let the user run it. Don't just ask
first — don't even *offer* to build/serve/test as a next step; say what's worth verifying and
stop there. Rely on diagnostics/type-checker feedback instead of running the suite for
self-verification. If a run seems genuinely necessary to make progress, ask first and wait for a
clear yes — but treat "ask" as the floor, not the target; the stronger default is not proposing it
at all.

**Narrow, explicitly-granted exception:** project scaffolding (`ng new` / initial project
generation) was once explicitly carved out by the user as delegable ("the project generation you
can do by yourself") — confirmed narrow (scaffold-only, not a blanket override) via follow-up
question. Treat any such carve-out as scoped to the specific session/ask it was granted in, not a
standing default — installs, builds, tests, dev servers, and benchmark/verification runs remain
manual-only unless a given conversation says otherwise.
