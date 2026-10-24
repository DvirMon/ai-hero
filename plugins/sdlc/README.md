# sdlc

The ticket-to-PR pipeline, as a plugin in the `ai-hero` marketplace.

```
/to-intake → /to-ticket → /grill-with-docs → /to-spec → /to-issues → /to-tasks → /impel → /review → /ship
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
a declared dependency (`.claude-plugin/plugin.json`), which `/impel` and `/ship` call as
`code-review:review`.

Then run `/setup-skills` once (or `/to-ticket`, which runs it when the repo has no
`.claude/workflow.json`).

## Local development

```bash
claude --plugin-dir ~/git/ai-hero/plugins/code-review \
  --plugin-dir ~/git/ai-hero/plugins/sdlc
```

The files load in place; `/reload-plugins` picks up edits.

## Prerequisites

These live outside the plugin, in `~/.claude`, and the pipeline calls them:

- **Skills:** domain-modeling, unit-test, story-create,
  angular-developer, react-developer, figma-to-code
- **Contracts** (`~/.claude/conventions/doc-contracts/`): decisions-log, adr, jsdoc,
  story-doc
- **Agents:** doc-compressor, adr-writer
- **Optional:** a skill that implements a tracker operation, e.g. `jira-grill-comment`
  for `## Post a comment` on Jira
- **Optional:** a commit skill named in `capabilities.commit.skill`, e.g. `atomic-commit`;
  unset, stages commit plain conventional (`contracts/commit.md`)

## Layout

```
.claude-plugin/plugin.json
skills/      the stages, plus setup-skills
contracts/   ticket-decisions, prd, workflow-config, tracker, review-stage
agents/      tdd-planner, test-implementer, angular/react/story-implementer
```
