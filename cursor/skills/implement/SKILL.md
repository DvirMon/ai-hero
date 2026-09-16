---
name: implement
description: "Execute a ticket's task plan step by step, loading the right conventions for each step and writing the code yourself."
disable-model-invocation: true
portedFrom: 1de3b96b77aa
portedSelf: 6cae33127e79
---

# Implement

You are executing the plan directly, one step at a time — not just writing feature code
freehand. Read the task plan, then for each step load the conventions that step needs (per
the table below) before touching any files, so the code lands with the right conventions
applied. Then verify, commit, and close out.

## 1. Gather context

1. Find `state.json` in the target domain's `docs/` folder (or the workspace root the user
   points you at). Read `workspaceRoot` and `stack`.
2. Read all `<workspaceRoot>/docs/tasks/step-*.plan.md` in order — these are the plan from
   `/to-tasks`. Each step file is self-contained: `Task type`, files to create/edit, what to
   do, acceptance checks.
3. Read `<workspaceRoot>/docs/tasks/progress.md`. Skip steps already `✅ done`.
4. If no `docs/tasks/` folder exists, **do not fall through to implementing anyway.** Read the
   issue's `## Pipeline` block and obey the readiness ladder — see step 1b.
5. Only read `specPath`/`architecturePath` if a step is ambiguous — step files are the
   pre-digested version, not the spec itself.

If the user pointed at several tickets, do this per ticket and keep each ticket's steps as
its own ordered run.

## 1b. The readiness gate

An issue with no task plan is not automatically an issue you may implement. It is either an issue
the pipeline decided needs no plan, or an issue nobody has looked at yet — opposite situations.
The `## Pipeline` block on the issue body separates them (format, rungs and triggers:
`to-issues`, "The Pipeline block"). Read the block, never the labels — labels are a projection.

**An epic with children is never implemented directly.** Check the tracker's sub-issue relation
first; if it has children, refuse and point at the frontier child.

Then act on `readiness`:

| `readiness` | Do |
|---|---|
| `ready-for-agent` | Implement. The issue body is the step; its acceptance criteria are the checks. |
| `needs:tasks` | **Refuse.** `Next: /to-tasks <#>` |
| `needs:issues` | **Refuse.** `Next: /to-issues <#>` |
| `needs:spec` | **Refuse.** `Next: /to-spec <#>` |
| `needs:grill` | **Refuse.** `Next: /grill-with-docs <#>` |
| `needs:triage` | Assess, write the verdict back, **ask**. Never proceed on your own verdict. |

**Refuse means refuse.** Say which rung fired and what tripped it, hand over the pointer line, and
stop — no partial implementation, no "I'll make a start on the easy part", no offer to run the
missing stage inline. The stages exist to arrive in a fresh context; running one here and
implementing off it in the same window is the thing being prevented.

On a **sub** (the block has an `epic:` key), `needs:spec` and `needs:issues` are unreachable —
a sub's contract is the epic's. `needs:grill` **is** reachable and normal: an epic's grill often
leaves one question scoped to one slice. Refuse and point at the child, not the epic. If several
siblings read `needs:grill` at once, say so — that is the epic's grill having failed, and the
regrill belongs there.

On `needs:triage`: apply `to-issues`' triggers, write the rung and its dated reason into the
block using the tracker's own CLI, re-sync the rung label, then stop and ask. **You may not
promote an issue to `ready-for-agent` yourself** — you are the party that benefits from the
answer, so it is not yours to give. Ambiguity resolves upward.

**No `## Pipeline` block at all** (an issue predating the convention): treat it as `needs:triage`
and stamp a block while you assess.

If the user explicitly says to implement a refused issue anyway, that is their call — proceed, and
note in your final report which stage was bypassed.

## 2. Classify each step

Every step file declares a `Task type`. Combine it with the ticket's `stack` from
`state.json`:

| `Task type` | `stack` | Load before executing |
|---|---|---|
| `code` | `react` | the `react-developer` skill |
| `code` | `angular` | the `angular-developer` skill |
| `code` | `node` | the `nodejs-developer` skill |
| `story` | any | this repo's Storybook/story conventions (a story-writing skill/doc if one exists) |
| `test` | any | this repo's testing skill/convention doc |
| `docs`, `chore` | any | no extra skill — just the step file |

One exception on tests: if the step belongs to a DS component going through the `ds-plan` /
`ds-scaffold` pipeline (there's a `docs/prd.md` and a versioned plan folder), follow that
pipeline's test-scaffolding conventions instead of the generic testing skill — it works from
`componentName`/`componentFilePath`/`prdPath`/`planDir`, not a step file.

If a step file has no `Task type`, infer it from the files it touches (`*.stories.tsx` →
`story`, `*.spec.ts(x)` → `test`, else `code`) and **say so in your final report** — an
inferred type means `/to-tasks` produced an incomplete step file.

If `stack` is missing from `state.json`, infer it from the project's dependencies and write it
back so later runs don't re-infer.

## 3. Execute

Work through steps **in order, one at a time** — even when two steps declare no `Depends on:`
on each other and their `Files` lists don't overlap, do them sequentially rather than
interleaving; steps are ordered so each leaves the codebase working, and jumping around breaks
that guarantee.

For each step:

1. Mark it `▶ in progress` in `progress.md`.
2. Load the skill/convention named by the table above (skip if the step's row says none).
3. Read the step file's Files + What To Do, and implement exactly that — nothing more, nothing
   from later steps.
4. Check the step's acceptance checks yourself before moving on. A step you claim is done is a
   claim, not proof — actually re-read the files you touched and confirm they satisfy the
   checks.
5. Mark `✅ done` in `progress.md`, or stop and surface the blocker.

A `story` or `test` step always comes after the `code` step that produces its subject — don't
reorder around that even if the plan lists them out of that order.

Use `/tdd` where the plan named a seam for it.

## 4. Verify

After all steps complete:

- Run typechecking across affected projects.
- Run the full test suite once.
- Use `/code-review` to review the work.

## 5. Close out

Before committing: show the user a summary of changed files and the `/code-review` outcome,
then wait for explicit approval. Do not commit until the user confirms.

Commit to the current branch.

If the work came from a tracked ticket/issue, before closing it, check off each satisfied item
in its "Acceptance criteria" section (`- [ ]` → `- [x]`, per the `to-issues` issue template) by
editing the issue body — for GitHub, `gh issue edit <n> --body-file -` with the updated body
(fetch current body first via `gh issue view <n> --json body --jq .body`). Leave unmet criteria
unchecked and flag them instead of closing.

Then close it once committed — follow the repo's issue tracker convention (see
`docs/agents/issue-tracker.md` if `setup-skills` has been run) for the close command and
comment format. Skip this if there's no source ticket.

If the project also maintains a backlog/status file (e.g. referenced from the project's own
`CLAUDE.md`), update that ticket's status/link there too, in the same commit.

## 6. Hand off

Report per step: which skill/conventions were loaded for it, files touched, acceptance checks
met, any inferred `Task type`.

Check the tracker for the next frontier issue (`/to-issues`'s "Work the frontier" convention —
any issue whose blockers are all done). End your final message with a one-line pointer, as the
very last line — nothing after it:

```
Next: /to-tasks <next-frontier-issue-#-or-slug>
```

If no frontier issue remains, use `Next: none — all issues done` instead.
