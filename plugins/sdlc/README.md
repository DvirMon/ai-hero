# sdlc

The ticket-to-PR pipeline, as a plugin in the `ai-hero` marketplace.

```
/to-intake → /to-ticket → /grill-with-docs → /to-spec → /to-issues → /to-tasks → /implement → /review → /ship
```

Each stage is its own skill. You start each one yourself; the plugin only packages
them. Skills run as `/sdlc:<name>`, and the bare `/<name>` works when nothing else
uses that name.

## Install

In a repo's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "ai-hero": { "source": { "source": "github", "repo": "DvirMon/ai-hero" } }
  },
  "enabledPlugins": { "sdlc@ai-hero": true }
}
```

Installing `sdlc` also installs and enables `code-review` from the same marketplace — it is
a declared dependency (`.claude-plugin/plugin.json`), which `/implement` and `/ship` call as
`code-review:review`.

Then run `/sdlc:setup` once (or `/to-ticket`, which runs it when the repo has no
`.claude/workflow.json`). It writes one entry per project in the repo — an app, a server, a
library — with the skills each step type loads there
([`contracts/workflow-config.md`](contracts/workflow-config.md) § Projects). Stages name no
framework; the project config does.

Any stage can also load your own skills without being replaced: `stages.<stage>.skills`
([`contracts/stage-skills.md`](contracts/stage-skills.md)). Figma support ships that way, as the
`figma` plugin in this marketplace — one skill per stage (`figma:capture`, `figma:design-check`,
`figma:design-reference`, `figma:slicing`, `figma:steps`, `figma:implement`), wired only in
the projects that have designs.

## Local development

```bash
claude --plugin-dir ~/git/ai-hero/plugins/code-review \
  --plugin-dir ~/git/ai-hero/plugins/sdlc
```

The files load in place; `/reload-plugins` picks up edits.

## Prerequisites

These live outside the plugin, in `~/.claude`, and the pipeline calls them:

- **Skills:** domain-modeling, and whatever the repo's `projects` name — e.g. unit-test,
  angular-developer, react-developer, nodejs-developer, figma skills
- **Contracts** (`~/.claude/conventions/doc-contracts/`): decisions-log, adr, jsdoc.
  `story-doc` is vendored from the `story` plugin (`contracts/story-doc.md`)
- **Optional:** the `story` plugin, for `executors.story: "story:implementer"` and
  `docs.prdWriter: "story:discovery"`
- **Agents:** doc-compressor, adr-writer
- **Optional:** a skill that implements a tracker operation, e.g. `jira-grill-comment`
  for `## Post a comment` on Jira
- **Optional:** a commit skill named in `capabilities.commit.skill`, e.g. `atomic-commit`;
  unset, stages commit plain conventional (`contracts/commit.md`)

## Layout

```
.claude-plugin/plugin.json
skills/      the stages, plus setup
contracts/   ticket-decisions, prd, workflow-config, tracker, review-stage, branch-guard, stage-skills, commit
agents/      implementer, test-implementer, tdd-planner
```
