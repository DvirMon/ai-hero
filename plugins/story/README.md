# story

The Storybook story pipeline, as a plugin in the `ai-hero` marketplace.

```
/story:setup → /story:discovery → /story:plan → /story:create → story:implementer → /story:docs
```

| Stage | Does | Output |
|---|---|---|
| `/story:setup` | reads the repo, writes `.claude/story.json` | config |
| `/story:discovery` | community pain, peer capabilities, internal coverage | the feature's PRD (`paths.prd`) |
| `/story:plan` | PRD vs. existing story hosts → minimal target story set | story plan (`docs.plan`) |
| `/story:create` | designs one story from the plan | story spec (`paths.specs`) |
| `story:implementer` | agent: writes the story code from a spec | story files |
| `/story:docs` | doc comments, `.mdx` wrappers, the project's conventions doc | docs |

Stages name no framework. The stack — `story:stack-angular`, `story:stack-react`, or any
installed skill — and the discovery sources come from `.claude/story.json`
([`contracts/story-config.md`](contracts/story-config.md)).

## Install

In a repo's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "ai-hero": { "source": { "source": "github", "repo": "DvirMon/ai-hero" } }
  },
  "enabledPlugins": { "story@ai-hero": true }
}
```

Then run `/story:setup` once.

## With sdlc

`story` does not depend on `sdlc`. To have `/implementation` run `type: story` steps through
the story implementer, set the executor slot in `.claude/workflow.json`:

```json
"projects": { "table": { "path": "**", "executors": { "story": "story:implementer" } } }
```

and `"docs": { "prdWriter": "story:discovery" }` to have discovery own the PRD.

## With design-system

`design-system` depends on `story`: its Storybook phase calls `/story:create` and the
`story:implementer` agent.

## Adding a stack

A stack skill (e.g. Vue) covers only how a story is built — the what lives in
`/story:create` and `contracts/story-spec.md`:

1. File layout and wiring — host component vs. render function, and which one `{conventions}` uses.
2. Controls and state — how args reach the component, reactive state, provider decorators.
3. Actions and docs — on-canvas buttons, MSW handler registration, "show code" for mechanisms
   outside the story file, `.mdx`, and the typecheck command.

Name it in `story.json` `skills.create` / `skills.implement` / `skills.docs`.

## Local development

```bash
claude --plugin-dir ~/git/ai-hero/plugins/story
```

## Prerequisites

- **Anchors file:** `~/.claude/discovery-sources.md` (or `sources.anchorsFile`) — data, read
  when present; discovery runs open without it.
- **Stack skills** a project names beyond the bundled ones (e.g. `angular-developer`).

## Layout

```
.claude-plugin/plugin.json
skills/      setup, discovery, plan, create, docs, stack-angular, stack-react
agents/      implementer, discovery
contracts/   story-config, story-spec, story-doc, prd (synced from sdlc)
```
