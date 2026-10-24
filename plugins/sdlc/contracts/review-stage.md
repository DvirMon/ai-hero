# Review stage

What the `/review` stage asks of a reviewer. This contract names no reviewer. The stage
resolves one from `stages.review.reviewer` in `.claude/workflow.json`
([`workflow-config.md`](workflow-config.md)); the default is `code-review:review`, which the
`sdlc` plugin installs as a dependency.

The reviewer knows nothing about the pipeline. It never reads or writes `state.json`,
`progress.md` or `review.md`, and never decides what runs next — the stage does all of that.

## Input

The stage invokes the reviewer as a skill, with one argument:

| Argument | Meaning |
|---|---|
| a fixed point (SHA) | review `git diff <sha>...HEAD` — the whole branch |
| `files: <paths>` | whole-file review (no branch diff, e.g. a planning branch) |

Spec sources are the reviewer's to find, from the commits' `Refs:` lines and the repo's own
docs. The stage passes nothing else.

## What the reviewer may do

- **May** edit files in the working tree to fix what it found.
- **Never** commit, push, rebase, or touch the tracker. The stage commits the edits.
- **Never** prompt for a decision the stage can't relay — a fix that needs the user (a public
  API change, a decision-record edit) stays a finding, unapplied.

## Output

A Markdown report. The stage reads only these parts; everything else is shown to the user
as is.

1. **Verdict line** — the first line that is not a `config:` line:
   `blocking: N` or `no blocking findings`. `N` counts what is still blocking **after** the
   reviewer's own fixes.
2. **One line per remaining blocking finding**, each with `path:line`, its severity (`P0`–`P2`)
   or conformance axis (`standards`, `spec`), and a one-sentence summary. A spec finding also
   states `fix-side: code | docs`.

`code-review:review` meets this through its review contract §9 (reporting) and §10
(hand-off). An org reviewer must produce the same two parts.

## Failure

| Case | Class | Stage does |
|---|---|---|
| `stages.review.reviewer` names a skill that isn't installed | construction | stop, name the key and the skill |
| reviewer errors, or the report has no verdict line | runtime | record `verdict: failed` with the reason, commit nothing, report it — `/ship` shows it at the gate |
