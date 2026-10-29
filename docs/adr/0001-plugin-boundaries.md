# Plugin boundaries — dependencies, shared files, and the review stage

Plugins stay self-contained units that consume each other only through declared
dependencies and namespaced entry points, never internal files. Small shared files
have one source in the plugin that owns their contract, copied by a sync script and
drift-checked in CI. Review is its own sdlc stage (`implement → review → ship`), swappable
via `stages.review.skill`; loose `~/.claude` skills are never plugin dependencies.
Only operations an org would actually replace get a config slot (`capabilities.<name>`
inside a stage, `stages.<stage>` for a whole stage, `projects.<name>.skills.<type>` for
per-project conventions), each defaulting to a skill in an installable plugin or, for a
capability, to no skill at all — unset, the stage does the operation itself; reference files
the plugin's own steps read are vendored. sdlc's executor agents are generic and load the
skills a project names (D7, amended 10-24). Story work is its own `story` plugin with
generic stages (setup, discovery, plan, create, implementer, docs), its own
`.claude/story.json`, and in-plugin stack skills; sdlc reaches it only through a
config-named executor slot (`projects.<p>.executors.<type>`), and design-system depends on
it for Storybook (D11–D13).

**Alternatives considered**

- Merge code-review into sdlc: the design-system workflow would need all of sdlc.
- Duplicate reviewer agents per plugin: eight agents drift across copies.
- Neutral root `shared/` folder: no owner for changes.
- Thin per-plugin `review` wrapper skill: the `workflow.json` stage slot is already the seam.
- Review as a step inside `/implement`: org reviewer not swappable, feedback loop hidden.
- Everything overridable: slotting contract files lets a repo break pipeline correctness and bloats config.
- `atomic-commit` as its own plugin so `capabilities.commit` has a plugin default: a format toggle doesn't justify a plugin.

**Consequences**

- sdlc calls `code-review:review` explicitly and declares `code-review` in its `plugin.json` dependencies.
- code-review needs `code-review--vX` release tags so semver ranges resolve.
- The review stage contract is sdlc-owned: input is a fixed point or file set plus spec sources; output is P0-P3 findings in one format. Revised by D9 in `docs/decisions/plugin-boundaries.md`: a `/review` stage skill runs the reviewer from `stages.review.reviewer` and records `review.md`, not `state.json`.
- A sync script and CI drift job must exist before any shared file lands.
- Legacy `claude-code/skills/code-review/` is deleted; it is what bare `/code-review` in implement/ship resolves to today, so both must name `code-review:review`.
- sdlc's loose-skill prerequisites violate the no-loose-skill rule; follow-up required.
- `capabilities.commit` has no default: unset, stages write a plain conventional commit; set (e.g. `atomic-commit`), every committing stage hands its commits to that skill.
- `workflow.json` gains `capabilities.<name>` (e.g. commit per implementation step via `atomic-commit`) and `projects.<name>` (path glob + skills per step type); doc-contracts and test references are vendored into sdlc via the sync; sdlc's stale `~/.claude/skills/impel/` references must be repointed to the plugin.
- Loose `story-create`, `story-plan`, `prd-discovery` and `ds-storybook-scaffolder` are deleted; `story-doc.md` becomes story-owned (synced into sdlc), `prd.md` stays sdlc-owned (synced into story).
- story.json `sources.packages` (peers discovery compares against) and design-system.json `sources.primitives` (libraries a DS builds on) are different facts; story never reads `design-system.json`.
