# sdlc

The ticket-to-PR pipeline, as a plugin in the `ai-hero` marketplace.

```
/to-intake → /to-ticket → /grill-with-docs → /to-spec → /to-issues → /to-tasks → /impel → /ship
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

Then run `/setup-skills` once (or `/to-ticket`, which runs it when the repo has no
`.claude/workflow.json`).

## Local development

```bash
claude --plugin-dir ~/git/ai-hero/plugins/sdlc
```

The files load in place; `/reload-plugins` picks up edits.

## Prerequisites

These live outside the plugin, in `~/.claude`, and the pipeline calls them:

- **Skills:** domain-modeling, atomic-commit, unit-test, story-create,
  angular-developer, react-developer, figma-to-code
- **Contracts** (`~/.claude/conventions/doc-contracts/`): decisions-log, adr, jsdoc,
  story-doc
- **Agents:** doc-compressor, adr-writer
- **Plugins:** `code-review` (same marketplace; `/impel` runs it, `/ship` reports it)
- **Optional:** a skill that implements a tracker operation, e.g. `jira-grill-comment`
  for `## Post a comment` on Jira

## Layout

```
.claude-plugin/plugin.json
skills/      the stages, plus setup-skills
contracts/   ticket-decisions, prd, workflow-config, tracker
agents/      tdd-planner, test-implementer, angular/react/story-implementer
```
