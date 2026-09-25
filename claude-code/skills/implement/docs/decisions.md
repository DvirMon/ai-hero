# Decisions

## The commit writes `Closes #N` itself, in direct-push mode

Decided 2026-09-24. In direct-push repos there is no PR body for `/ship` to write `Closes #N`
into — the commit message is the only place the keyword can live, and `/ship` refuses to amend a
commit to add it after the fact (rewriting a commit `/implement` already authored isn't `/ship`'s
call to make). So step 5 ("Close out") checks the repo's Ship mode flag
(`docs/agents/issue-tracker.md`) before writing the commit message, and includes `Closes #N` for
every issue this run fully implemented when that flag is direct-push.

**Why:** found via a real gap — `ng-table` (direct-push mode) had a 30-commit backlog where only
one commit carried `Closes #N` (written by an earlier, unrelated session), and every other
shipped issue had to be closed by hand after the fact. Neither `/implement`'s prior instructions
nor `/ship`'s ever added the keyword; `/ship` explicitly refuses to amend history, so the gap had
nowhere else to close from.

**How to apply:** the check is per-run, not per-workspace — only issues this specific run fully
implemented get the keyword, never every issue a shared epic `state.json` happens to list.
PR-gated mode is unaffected; `/ship` still owns writing `Closes #N` into the PR body there.

## /implement is a dispatcher, not an executor

Decided 2026-07-28. In the `/to-ticket` → … → `/implement` pipeline, **skills are knowledge
SSOTs and agents are executors**. `/implement` writes no feature code by default — it routes.

Routing keys: `state.json.stack` (`react|angular|node|none`, set by `/to-ticket`) × step file
`Task type` (`code|story|test|docs|chore`, required by `/to-tasks`).

| type + stack       | agent               | skill the agent loads          |
|---------------------|----------------------|----------------------------------|
| code + react        | `react-implementer`  | `react-developer`                |
| code + angular      | `angular-implementer`| `angular-developer`              |
| story               | `story-implementer`  | `story-create`                   |
| test                | `test-implementer`   | `unit-test` (see its own decisions.md for the testing-skill-architecture split) |
| test, DS pipeline   | `ds-test-scaffolder` | reads references directly        |

**Why:** agents can invoke skills, skills cannot spawn agents. Only agents can run in parallel or
be dispatched dynamically, so execution has to live there. Enforcement lives in `/to-tasks` — one
`Task type` per step, so a component+stories step must split in two, otherwise story conventions
never load.

**How to apply:** agents are named `*-implementer`, deliberately NOT the same name as their skill
(`react-developer` skill vs `react-implementer` agent) — identical names make dispatching a skill
vs. dispatching an agent ambiguous at call time. Keep that separation when adding stacks.
Implementer agents never commit, never run builds/servers/full test suites — the dispatcher does
that once at the end, and only if the user confirms (see `never-run-build-serve-test-unprompted`
rule).

Note: this is a Claude-Code-native design (relies on agent dispatch). The Cursor port of this
skill rewrites the routing table as sequential "load this skill yourself, in order" steps, since
Cursor has no subagent dispatch mechanism — see the Cursor `implement/SKILL.md` for that version.
