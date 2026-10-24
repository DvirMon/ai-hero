---
name: ds-setup
description: Configure a project for the design-system pipeline — read the existing design system (components, tokens, barrels, stories, tests, primitive libraries), then write `.claude/design-system.json` and `docs/agents/design-system.md` from what it actually does, asking only about what the repo can't answer. Run once per design system before `/ds-wayfinder`; `/ds-wayfinder` and `/ds-discovery` run it when the config is missing. Also migrates a legacy `ds-wayfinder.config.json`.
---

# DS Setup

Writes the two per-project files every phase reads:

- **Config** — `.claude/design-system.json`, per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-config.md`
- **Conventions** — `docs/agents/design-system.md`, per `${CLAUDE_PLUGIN_ROOT}/contracts/ds-conventions.md`

The plugin's skills hold only what is true for every design system. Everything this one does
differently is learned here, from the repo, and written to those two files.

This is a prompt-driven skill, not a script. Explore, present what you found, confirm, then
write. **Derive before asking:** every value that the repo answers comes from the repo, with
the file it came from. Ask only for what exploration could not settle.

## 1. Explore

Find the project root first: the nearest `package.json` with a design-system library under it,
or the directory the user names. Then read — don't assume:

- **Prior config** — `.claude/design-system.json`, `.claude/design-system.local.json`,
  `docs/agents/design-system.md`, a legacy `.claude/ds-wayfinder.config.json`,
  `.claude/figma-project.json` (its `stack`, `designSystem`, `tokens`, `codeConnect` pre-fill
  this config — never contradict it silently).
- **Framework** — `package.json` dependencies (`@angular/core`, `react`). Anything else is not
  supported yet: say so and stop.
- **DS library** — workspace/library config (`project.json`, `ng-package.json`, `package.json`
  `exports`), the folder that holds most components, the folder naming of 3–5 components.
- **Prefix and naming** — selectors / component names / file names across those components.
- **Public API** — per-component `index.ts` / `public-api.ts`; a root barrel and the export line
  it uses; the import path consumers use (tsconfig `paths`, package `exports`).
- **Tokens** — files defining custom properties or SCSS variables; role vs palette tiers; a
  theme class that activates them; motion tokens. Grep, don't recall.
- **Styling** — style file language; encapsulation; escape hatches in use (`::ng-deep`,
  `:global`); units (rem/px).
- **Primitive libraries** — which of the catalog libraries
  (`${CLAUDE_PLUGIN_ROOT}/skills/ds-discovery/references/primitives.{framework}.md`) are
  installed and actually imported by components; any internal overlay/portal/focus wrappers.
- **Building blocks** — the icon component (and its key format), button, overlay service.
- **Storybook** — `.storybook/`, where stories live relative to components, file naming, tags,
  MDX.
- **Tests** — runner (`jest`, `vitest`, `karma`), spec file naming, the test command.
- **Convention docs** — `CONTRIBUTING.md`, `README.md`, `AGENTS.md`/`CLAUDE.md` under the DS
  root, ADRs. These become `sources.conventions`.
- **Figma** — connected Figma MCP tools (`ToolSearch("figma")`).
- **Slot skills** — installed skills that fit a slot in `ds-config.md` § Slots: a framework
  developer skill, a CSS/styling skill, a unit-test skill, a Storybook story skill, a
  prototype skill, a map/wayfinder skill, a Code Connect skill. Match by what the skill
  describes, not by name; only skills in the session's available-skills list count.

Read **two or three real components end to end** (class, template, styles, stories, spec,
exports). Conventions come from what they agree on; where they disagree, note both.

## 2. Present findings and ask

Summarise what was found as a draft of both files, each value tagged with its evidence path.
Then take the gaps one at a time, recommended answer first (`AskUserQuestion` when the options
are finite). Typical gaps:

- **Prefix** when components disagree, or the DS has none.
- **Token tiers** — which families a component may use, which file is off-limits (palette).
- **Theme class** — when tokens resolve only under a class.
- **Root registration** — whether new components are added to a root barrel.
- **Sources** — reorder or extend `sources.primitives` / `sources.references`; extra a11y,
  convention and Storybook sources; exemplar components (`sources.siblings`).
- **WCAG target** — `a11y.wcag`, default `2.2-AA`.
- **Slots** — one question per slot with a candidate skill: offer the candidates and
  `Leave unset`. Ask about `stages.review.skill` only when an installed skill reviews
  components (default: the built-in `code-review` dispatch).

Skip a gap the repo settled. Never ask the user to confirm a value you have evidence for —
show it in the draft instead.

**Universal rules are not questions.** Token-only styling, atomic composition, live a11y
sources, reduced motion and logical CSS apply even when this DS doesn't follow them yet
(`ds-config.md` § Universal rules). If the DS has no tokens, record `tokens.sources: []` and
say components will declare their own custom properties — don't offer to turn the rule off.

## 3. Write

Show the final drafts and let the user edit them, then write:

1. `.claude/design-system.json` — `version` plus only keys that differ from the contract's
   defaults.
2. `docs/agents/design-system.md` — every required section from `ds-conventions.md`, starting
   from the framework example and replacing each rule with what the repo does:
   - [examples/design-system.angular.md](examples/design-system.angular.md)
   - [examples/design-system.react.md](examples/design-system.react.md)

   The examples are framework defaults, not this DS. A rule kept from an example without repo
   evidence is marked `(plugin default)`.
3. `.gitignore` gains `.claude/design-system.local.json`.
4. A legacy `.claude/ds-wayfinder.config.json` is deleted after its values are carried over
   (`project.framework` → `framework`, `designSystem.path` → `paths.root`,
   `references.styleTokensPath` → `tokens.sources`, `references.publicApiBarrel` →
   `publicApi.rootBarrel`, `output.docsDir` → `paths.docs`). Confirm the delete.

These edits are a change to the repo: make them on a branch, never on the default branch.

## 4. Done

Validate the config against `ds-config.md` (every key known, every required key present, every
path exists). Tell the user which phases now read these files, and that both files can be edited
directly — re-running setup is only needed to re-derive from scratch. Then continue with
whatever invoked setup.
