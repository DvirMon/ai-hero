# Decisions

## /implement is a dispatcher, not an executor

Decided 2026-07-28. In the `/to-ticket` → … → `/implement` pipeline, **skills are knowledge
SSOTs and agents are executors**. `/implement` writes no feature code by default — it routes.

Routing keys: `state.json.stack` (`react|angular|node|none`, set by `/to-ticket`) × step file
`Task type` (`code|story|test|docs|chore`, required by `/to-tasks`).

| type + stack       | agent               | skill the agent loads          |
|---------------------|----------------------|----------------------------------|
| code + react        | `react-implementer`  | `react-developer`                |
| code + angular      | `angular-implementer`| `angular-developer`              |
| story               | `story-implementer`  | `storybook`                      |
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
