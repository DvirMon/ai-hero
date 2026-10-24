---
name: implementation
description: "Execute a ticket's task plan by dispatching each step to an executor agent, with the skills the step's project names in .claude/workflow.json."
disable-model-invocation: true
---

# Implementation

You are a **dispatcher**, not an implementer. Skills hold conventions, agents execute: you read
the plan, send each step to its executor with its project's skills, commit each step as it lands,
then typecheck and close out. You write no feature code yourself.

## 1. Gather

1. Resolve the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading it.
2. Find `state.json` (`<domain-path>/docs/work/<slug>/`) and validate it per
   `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md`. The issue's Pipeline block
   says `workspace: null` → there is none; don't create one.
3. **Tasks root** per `/to-tasks` § 5. Read every `step-*.plan.md` in order, and note which have a
   sibling `step-N-<slug>.test-plan.md` — those run test-first.
4. Read `progress.md`: skip `✅ done` steps. Its graph (Mermaid `graph LR`) is the schedule.
5. **No plan** → apply `${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md`
   § The implementation gate. Never fall through to implementing.
6. Run `${CLAUDE_PLUGIN_ROOT}/contracts/branch-guard.md`. An issue with no branch yet (a
   `ready-for-agent` issue with no plan) → run `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md`
   with `<type>/<N>-<slice-slug>` first.

Several tickets → one run, branch and worktree each; never two issues' commits on one branch.

## 2. Route

Each step's **project** is the one its `files` match (config § Projects). Its executor comes from
the step's `type`:

| `type` | Executor | Skills passed |
|---|---|---|
| `code`, `story`, `docs`, `chore` | `sdlc:implementer` | `skills.<type>` (+ `skills.ui` on a Figma step) |
| `test` | `sdlc:test-implementer` | `testSkills` = `skills.test`, `codeSkills` = `skills.code` |
| `verify-ui` | inline | `references/figma-ui.md` § `verify-ui` steps |

Pass `stepFilePath`, the project's `typecheck` / `test`, and `specPath` / `architecturePath` /
`designPath` when set. Figma steps also get the brief from `references/figma-ui.md`.

- Files that match no project, or span two → plan defect: stop and name the files.
- A step with no `type` → infer from its files (`*.stories.*` → `story`, `*.spec.*` → `test`,
  else `code`) and report it.

**Test-first** (a test plan sits beside the step): one step, three dispatches, in order — phase
rules in `unit-test`'s `references/test-first.md`.

| Phase | Executor | Extra inputs |
|---|---|---|
| 1. Red | `sdlc:test-implementer` | `testPlanPath`, `phase: red` |
| 2. Green | `sdlc:implementer` | `testPlanPath` |
| 3. Types | `sdlc:test-implementer` | `testPlanPath`, `phase: types` — skip when the plan says `None` |

A test that passes against a stub in red, or green `blocked` on a seam, is a plan defect: stop
and surface it. Never re-dispatch red to rewrite a test.

**Decisions made while executing** — anything the step, spec or design didn't settle — go to
`decisionsPath` per `${CLAUDE_PLUGIN_ROOT}/contracts/ticket-decisions.md`, phase `implement`,
through a writer per `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/file-writes.md`.
`progress.md` flips go through the same writer.

## 3. Execute

**Schedule:** dispatch the frontier — every pending step whose `depends_on` are all done —
concurrently; recompute as each finishes. Before dispatching a frontier, compare its steps'
`files`. An overlap is a plan bug: let running steps finish, add the missing edge to
`depends_on` and the graph, re-run `/to-tasks`' writer if a step's `## Do` changes, report it,
resume. Never run an order that isn't written back to the plan.

Per step:

1. Mark `▶ in progress`.
2. Dispatch — one agent call per step (a test-first step's three phases are the exception).
3. Check the agent's claims against the files it says it touched. `done` is a claim, not proof.
4. Mark `✅ done`, or `🧪 awaiting CI` when `## Done when` is a behavioural claim only the suite
   proves (it counts as done for scheduling). Or stop and surface the blocker.
5. **Commit** once the `progress.md` flip is on disk.

**One step = one commit**, no approval prompt — the human gate is `/ship`.

- Stage the step's `files` plus `progress.md`, by path. Never `git add -A`. A changed file not in
  `files` is a plan defect: include it and report it.
- Commit per `${CLAUDE_PLUGIN_ROOT}/contracts/commit.md`: type = the step's `commit` frontmatter
  (missing → inferred from `type`, reported), subject = the step title, issue `#<N>`, stage
  `s<step>`, plus the epic and ticket title when known. A commit-skill blocker is a step blocker.
- No plan (the issue body is the step): one commit, staged by path, type from the change, no
  stage.

## 4. Verify

After the last step:

1. **In the background:** each affected project's `typecheck` (spec configs too where specs
   changed). CI runs lint and the full suite on the PR — don't duplicate them.
2. **Meanwhile:** run `source-docs` over the non-spec `.ts` files the steps touched; its edits
   land as their own `docs` commit (per `commit.md`, issue `#<N>`).
3. **Join.** A red typecheck is fixed first, as a new `fix` or `ref` commit (per `commit.md`) —
   never folded into a step's commit.

Say plainly that tests haven't run locally: the work is green in CI or not green at all.

## 5. Close out

- `git status --porcelain` must be empty. Leftovers belong to a step: commit them against it, or
  report them.
- Tick each satisfied acceptance criterion on the issue (`- [ ]` → `- [x]`) through
  `docs/agents/issue-tracker.md`. A tracker whose description is never edited (Jira) gets a
  met/unmet list in the report instead. Unmet criteria stay unticked and flagged — `/ship` then
  writes `Refs` instead of `Closes`.
- Never close the issue; the PR's merge does.

## 6. Hand off

Report per step: executor, skills, files, `Done when` results, commit (`<sha> <subject>`), and
anything inferred. Also any edge the overlap check added, and `git log --oneline origin/<default>..HEAD`.

Last line, nothing after it — `/review`, or `/ship` when `stages.review.skill` is `none`:

```
Next: /review <issue-#-or-slug>
```
