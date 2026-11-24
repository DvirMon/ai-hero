# Target workspace layout (D6)

One fact, one file. Every other copy is drift to migrate or delete.
`scripts/snapshot-local.mjs` encodes this file set (`ROOT_ALLOWED`,
`TASK_ALLOWED`). Change both together.

## File set

| File | Owns | Must not hold |
|---|---|---|
| tracker (remote) | slice list, sub-task state, ACs, Blocks links | — |
| `state.json` (schema v5) | `units[]`: branch, worktree, MR, readiness rung, `assessed` | progress notes, removed keys |
| `prd.md` | tagged copy of tracker ACs: `[KEY · MM-DD]` | local-only criteria |
| `decisions.md` | every decision, `D<n>`, `replaces D<n>` / `superseded by D<n>`, `## Open` | status, conversation |
| `spec.md` | behavior rules, design | decisions, checklists |
| `3-architecture.md`, `design.md` | as written by `to-spec` | status |
| `issue-graph.md` | slice ↔ key, edges | State column, frontier |
| `discovery/<topic>.md` | proof behind a decision (code audits, flow maps, comparisons, captures) | status |
| `tasks/issue-<N>/step-N-*.plan.md` | scope, `depends_on`, `jira:` key, `files:`, `## Do` + `## Done when` boxes | status |
| `tasks/issue-<N>/step-N-*.test-plan.md` | test design | status |
| `tasks/issue-<N>/progress.md` | step status (`⬚ ▶ ✅ 🧪 ⏭`), AC → step coverage table | tracker sync lines |
| `tasks/issue-<N>/review.md` | review outcome | — |
| `e2e-<KEY>/` (e.g. `e2e-PROJ-123/`) | every e2e / verify-ui artifact of the ticket: `config.json`, `report.md`, `test-data.md`, `manifest.json`, screenshots. Written by the repo's e2e harness, not a plugin | status beyond the check results |
| `index.md` | generated start page: links every file. Nav lines, `d<n>` / `ac-N` anchors: sdlc `contracts/workspace-links.md` | hand edits |
| `audit/` | this skill's snapshots, verdicts, `applied.jsonl`, reports | — |

Assets (`.png`, `.html` twins, captures) are ignored by the layout check.

## Epic layout (also accepted, D18)

One epic ticket with several linked tickets, each planned in its own
folder. Use it when the slices are separate tickets, not sub-tasks.

```
<epic-slug>/                    epic root: the D6 file set above
  state.json  prd.md  decisions.md  discovery/  audit/
  t<N>-<key>-<slug>/            one slice = one linked ticket
    state.json                  its own unit (branch, MR, readiness)
    spec.md                   slice spec with its checklist
    tasks/step-N-*.plan.md      no issue-<N>/ level
    tasks/progress.md           step status + AC coverage
    audit/                      this skill's artifacts for the slice
```

- `prd.md` and `decisions.md` live only at the epic root. A slice
  never needs its own; decisions of a slice go to the root file.
- Migration runs at two levels, each as its own run of
  `snapshot-local.mjs`: the epic root (the root file set; slice folders
  are skipped) and each slice folder (`<root>/t<N>-…`, checked as its
  own workspace). Same buckets and one question per item at both levels.
- A slice with no tracker key yet is fine; propose a key when the
  ticket is created.
- Loose handoffs, plans and `N-progress.md` inside a slice are migrated
  by the same buckets: facts go to the slice `spec.md`,
  `tasks/progress.md`, the root `decisions.md`, or `discovery/`.
- Tracker alignment: the root is compared with the epic ticket, each
  slice with its own linked ticket.

## Normalize buckets (absorbed from `organize-ticket-docs`)

| Bucket | How to recognize | Proposed action |
|---|---|---|
| Routing-slip handoff | `DELETE THIS FILE` banner; tells another session what to do | delete, after the git check |
| Plan, work committed | plan with a delete-when-done banner; `3-plan.md`, `N-plan.md` | fold any unique fact into its D6 owner, then delete after the git check |
| Duplicate status | `N-progress.md`, root `progress.md`, `pipeline.md`, sync lines | merge rows into `tasks/issue-<N>/progress.md`, then delete |
| Durable record / proof | findings, flow maps, comparisons, captures | keep under `discovery/<topic>.md`; move a loose one there (a move needs a yes). The term is always "discovery", never "research" |
| Tracker copy | `jira-snapshot.md`, `jira-ac-coverage.md` | ACs → `prd.md`; coverage → `progress.md` table; delete |
| Decisions elsewhere | `decisions.md`, "Decisions made" in a spec, plan § Decisions | move to `decisions.md` with D-numbers |
| Sub-workspace | `t*/` with its own `state.json` that does not follow the epic layout below (no epic root, or a slice with no tracker key) | flatten into `tasks/issue-<N>/`, one per slice, one `state.json`. A `t<N>-<slug>/` folder under an epic root that follows the epic layout is accepted: do not flatten |
| State | `state.json` below v5, removed keys | rewrite to v5, preserve unknown keys |
| E2E artifact | `verify-ui*.md/json`, `test-data.md`, screenshot dirs, e2e configs at the root | move into `e2e-<KEY>/`. First `git grep` the old path in source: committed e2e code that reads it needs the same change, shown to the user as a separate diff |
| Unclear | none of the above | ask, never guess |

## Guardrails (carried over)

- `docs/work/` is usually git-ignored: a delete is permanent. Each delete is its own question.
- Git check before deleting a "done" plan or handoff: `git log --oneline -- <files it names>` and
  `git show --stat <sha>` on the unit's branch; `git status --short -- <files>` for uncommitted work.
  A banner saying "committed" is a claim, not proof. Not proven → keep it and say why.
- Before deleting, move any unique fact (a finding, a measured number, a gap) to its D6 owner, one line with source.
- Never commit, stash, revert, or edit source files. Never run builds or serves.
- After a delete or rename: `rg -n '<name>' <workspace>` and fix dangling links only.
- `decisions.md` rules: `ticket-decisions.md` in the sdlc plugin (`~/.claude/plugins/cache/ai-hero/sdlc/*/contracts/`).
  Append only, never renumber. `state.json` fields: `skills/to-ticket/references/state-schema.md` in the same plugin.
