# design-system

Builds design-system components from a Figma design, as a plugin in the
`ai-hero` marketplace. Works for any design system: everything one design
system does differently from another lives in that project's config, not in the plugin.

```
/ds-setup (once) → /ds-discovery → /ds-interview → /ds-spec → /ds-plan → /ds-scaffold → /ds-review → /ds-ship
```

`/ds-wayfinder` is the entry point: it reads the component's state on disk and routes to the
next phase. Skills run as `/design-system:<name>`; the bare `/<name>` works when nothing else
uses that name.

## Install

In a repo's `.claude/settings.json` (or `~/.claude/settings.json` for every repo):

```json
{
  "extraKnownMarketplaces": {
    "ai-hero": { "source": { "source": "github", "repo": "DvirMon/ai-hero" } }
  },
  "enabledPlugins": { "design-system@ai-hero": true }
}
```

Then run `/ds-setup` once per design system (or `/ds-wayfinder`, which runs it when the project
has no `.claude/design-system.json`).

## Per-project config

`/ds-setup` reads the existing design system and writes two files:

| File | Holds | Contract |
|---|---|---|
| `.claude/design-system.json` | values — prefix, paths, token rules, ordered source lists, WCAG target | `contracts/ds-config.md` |
| `docs/agents/design-system.md` | conventions in prose — component shape, exports, file layout, styling, tests, review rules | `contracts/ds-conventions.md` |
| `.claude/story.json` (one entry) | Storybook — story paths, stack skills, story-conventions doc; written by `/story:setup`, which `/ds-setup` calls | `story` plugin, `contracts/story-config.md` |

Per-user values (your Figma MCP tool names) are the plugin's `userConfig`, prompted when the
plugin is enabled and editable in `/config` — never a repo file.

The plugin keeps only the rules true for every design system (token-only styling, atomic
composition, live a11y sources, reduced motion, logical CSS) — `ds-config.md` § Universal rules.

## Local development

```bash
claude --plugin-dir ~/git/ai-hero/plugins/design-system
```

The files load in place; `/reload-plugins` picks up edits.

## Prerequisites

- **Plugins:** `code-review` — a declared dependency, installed with this plugin;
  `/ds-review` runs its `code-review:*-reviewer` agents. `story` — a declared dependency;
  `/ds-scaffold` creates stories through `/story:create` and the `story:implementer` agent,
  `/ds-review` audits them with `/story:docs`
- **Conventions:** `~/.claude/conventions/testing/testing-principles.md` (test scaffolder)
- **Optional:** a Figma MCP server; the `ng-primitives` MCP

No loose skill is required. Skills the pipeline can use — a framework developer skill, CSS,
unit-test, prototype, map and Code Connect skills, or an org's own reviewer — are
config slots (`contracts/ds-config.md` § Slots). `/ds-setup` fills them from what is installed;
unset slots fall back to `{conventions}` and the plugin's own references. Storybook stack
skills are `story.json` `skills.create` / `skills.implement`, not slots here.

## Layout

```
.claude-plugin/plugin.json
contracts/   ds-config, ds-conventions, phase-state
skills/      ds-setup, ds-wayfinder, and the seven phases
agents/      discovery (figma, primitives, codebase, a11y), spec (prd, a11y, architect),
             planner, scaffolders (component, styles, test)
```
