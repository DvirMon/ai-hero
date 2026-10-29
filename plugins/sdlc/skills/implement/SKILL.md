---
name: implement
description: "Execute a ticket's task plan by dispatching each step to an executor agent, with the skills the step's project names in .claude/workflow.json."
disable-model-invocation: true
---

# Implement

You are a **dispatcher**, not an implementer. Skills hold conventions, agents execute: you read
the plan, send each step to its executor with its project's skills, commit each step as it lands,
then typecheck and close out. You write no feature code yourself.

## 1. Gather

1. Resolve the workflow config per `${CLAUDE_PLUGIN_ROOT}/contracts/workflow-config.md` § Reading it.
2. **Load the wired skills.** Invoke each skill in `stages.implement.skills` with the Skill
   tool, now, before any other work — reading its file is not loading it. Contract:
   `${CLAUDE_PLUGIN_ROOT}/contracts/stage-skills.md`.
3. Find `state.json` (`<domain-path>/docs/work/<slug>/`) and validate it per
   `${CLAUDE_PLUGIN_ROOT}/skills/to-ticket/references/state-schema.md`. The issue's Pipeline block
   says `workspace: null` → there is none; don't create one.
4. **Find the plan.** The tasks root is `<workspaceRoot>/tasks/issue-<N>/`, or with no workspace
   `.pipeline/issue-<N>/` at the checkout root. `.pipeline/` is gitignored, so a search that
   honours `.gitignore` skips it — list that directory. Read every `step-*.plan.md` in order, and note which
   have a sibling `step-N-<slug>.test-plan.md` — those run test-first.
5. Read `progress.md` there: skip `✅ done` steps. Its graph (Mermaid `graph LR`) is the schedule.
6. **No plan** (the directory is missing or has no step files) → apply
   `${CLAUDE_PLUGIN_ROOT}/skills/to-issues/references/pipeline-block.md` § The implementation
   gate. Never fall through to implementing.
7. Run `${CLAUDE_PLUGIN_ROOT}/contracts/branch-guard.md`. An issue with no branch yet (a
   `ready-for-agent` issue with no plan) → run `${CLAUDE_PLUGIN_ROOT}/skills/to-tasks/references/start-branch.md`
   with `<type>/<N>-<slice-slug>` first.

Several tickets → one run, branch and worktree each; never two issues' commits on one branch.

## 2. Route

Each step's **project** is the one its `files` match (config § Projects). Its executor comes from
the step's `type`:

| `type` | Executor | Skills passed |
|---|---|---|
| `code`, `story`, `docs`, `chore` | `sdlc:implementer` | `skills.<type>` |
| `test` | `sdlc:test-implementer` | `testSkills` = `skills.test`, `codeSkills` = `skills.code` |

**`executors.<type>` set** on the step's project → dispatch that agent instead (e.g.
`story:implementer` for `story`). Pass `stepFilePath` as its spec plus the same `typecheck` /
`test` / `specPath` inputs; skip `skills` — the named agent resolves its own conventions.

Pass `stepFilePath`, the project's `typecheck` / `test`, and `specPath` / `architecturePath` /
`designPath` when set.

**Wired skills extend routing.** A step type or frontmatter key not in this table belongs to the
wired skill that defines it — e.g. `figma:implement` adds the project's `skills.ui` and a
node-ID brief to `figma:` steps, and runs `verify-ui` steps inline. No wired skill claims it →
plan defect: stop and name the step.

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
   Background agents notify you when they finish; wait for that, never schedule a wakeup.
3. Check the agent's claims against the files it says it touched. `done` is a claim, not proof.
4. Mark `✅ done`, or `🧪 awaiting CI` when `## Done when` is a behavioural claim only the suite
   proves (it counts as done for scheduling). Or stop and surface the blocker.
5. **Commit this step now**, once the `progress.md` flip is on disk — before marking or
   committing any other step. Parallel steps finish one at a time; each gets its own commit.

**One step = one commit**, no approval prompt — the human gate is `/ship`.

- Stage the step's `files` plus `progress.md`, by path — `progress.md` only when the tasks root
  is tracked; the gitignored `.pipeline/` is never staged. Never `git add -A`. A changed file not in
  `files` is a plan defect: include it and report it.
- Commit per `${CLAUDE_PLUGIN_ROOT}/contracts/commit.md`: type = the step's `commit` frontmatter
  (missing → inferred from `type`, reported), subject = the step title, issue = its ref (`commit.md`), stage
  `s<step>`, plus the epic and ticket title when known. A commit-skill blocker is a step blocker.
- No plan (the issue body is the step): one commit, staged by path, type from the change, no
  stage.

## 4. Verify

After the last step:

1. **In the background:** each affected project's `typecheck` (spec configs too where specs
   changed). CI runs lint and the full suite on the PR — don't duplicate them.
2. **Meanwhile:** run the verify hooks of wired skills — e.g. `source-docs` over the source the
   steps touched. Their edits land as their own `docs` commit (per `commit.md`, same issue ref).
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

Report the wired skills loaded, then per step: executor, skills, files, `Done when` results, commit (`<sha> <subject>`), and
anything inferred. Also any edge the overlap check added, and `git log --oneline origin/<default>..HEAD`.

Last line, nothing after it — `/review`, or `/ship` when `stages.review.skill` is `none`:

```
Next: /review <issue-#-or-slug>
```
