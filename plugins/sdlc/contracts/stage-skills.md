# Stage skills

How a repo wires its own skills into a pipeline stage without replacing it. A stage does its
own job; the skills listed for it in `.claude/workflow.json` add to that job — Figma capture at
intake, a domain-modeling pass in grill, a docs pass after implementation.

`stages.<stage>.skill` replaces a stage. `stages.<stage>.skills` extends it.

## Resolve

The stage's list is the repo-level `stages.<stage>.skills`, then the ticket's project
`stages.<stage>.skills` appended ([`workflow-config.md`](workflow-config.md) § Projects),
duplicates dropped. No ticket yet (`/to-intake`) → the repo-level list only.

## Load

Right after resolving the config, before the stage's own work, invoke each listed skill via the
Skill tool, in order. A skill that isn't installed is a construction error: stop and name the
stage, the skill and the config layer it came from.

A wired skill gets no arguments. It reads what it needs — the stage name, `state.json`, the
config — from the session.

## What a wired skill may do

A wired skill names the stage it extends and the step it hooks into (`/to-ticket` § 4, say).
It may:

- add reads to the stage's gather step;
- add fields it owns to `state.json` (the schema lists the owner), sections to a document the
  stage writes, or frontmatter keys and step types to step files;
- add skills or a brief to an `/implementation` dispatch, or handle a step type itself;
- add checks to the stage's verify step, and lines to its report.

It may not:

- skip, reorder or replace the stage's own steps — that is `stages.<stage>.skill`;
- commit, push, or move the readiness rung — the stage does those;
- write to the tracker except through `docs/agents/*-tracker.md`.

A wired skill that doesn't apply to this ticket (no Figma frames, no UI) says so and does
nothing. Wire it once per stage; it decides per ticket.

## Report

The stage's hand-off lists the wired skills it loaded, and anything each one added.
