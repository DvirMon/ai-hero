# design-system

Builds design-system components from a Figma design, as a plugin in the
`ai-coding-guidelines` marketplace. Works for any design system: everything one design
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
    "ai-coding-guidelines": { "source": { "source": "github", "repo": "DvirMon/ai-coding-guidelines" } }
  },
  "enabledPlugins": { "design-system@ai-coding-guidelines": true }
}
```

Then run `/ds-setup` once per design system (or `/ds-wayfinder`, which runs it when the project
has no `.claude/design-system.json`).

## Per-project config

`/ds-setup` reads the existing design system and writes two files:

| File | Holds | Contract |
|---|---|---|
| `.claude/design-system.json` | values — prefix, paths, token rules, ordered source lists, WCAG target | `contracts/ds-config.md` |
| `docs/agents/design-system.md` | conventions in prose — component shape, exports, file layout, styling, Storybook, tests, review rules | `contracts/ds-conventions.md` |

The plugin keeps only the rules true for every design system (token-only styling, atomic
composition, live a11y sources, reduced motion, logical CSS) — `ds-config.md` § Universal rules.

## Local development

```bash
claude --plugin-dir ~/git/ai-coding-guidelines/plugins/design-system
```

The files load in place; `/reload-plugins` picks up edits.

## Prerequisites

These live outside the plugin, in `~/.claude`, and the pipeline calls them:

- **Skills:** angular-developer, react-developer, css-styling, unit-test, code-connect-authoring,
  story-create (optional)
- **Conventions:** `~/.claude/conventions/testing/testing-principles.md`
- **Plugins:** `code-review` (same marketplace; `/ds-review` runs its reviewers)
- **Optional:** a Figma MCP server; the `ng-primitives` MCP; the `wayfinder` skill for map mode

## Layout

```
.claude-plugin/plugin.json
contracts/   ds-config, ds-conventions, phase-state
skills/      ds-setup, ds-wayfinder, and the seven phases
agents/      discovery (figma, primitives, codebase, a11y), spec (prd, a11y, architect),
             planner, scaffolders (component, styles, storybook, test)
```
