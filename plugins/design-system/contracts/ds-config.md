# Design-system config

`<project>/.claude/design-system.json` — one per design system, written by `/ds-setup`. Every
phase skill and agent resolves it first. It holds **values**: names, paths, token rules, and
ordered source lists. The conventions the DS follows, written as prose, live beside it in
`docs/agents/design-system.md`, per [`ds-conventions.md`](ds-conventions.md).

The plugin holds only what is true for every design system. Anything one design system does
differently from another goes here or in the conventions doc, never in a skill.

## Files

`<project>/.claude/design-system.json` is the plugin's only repo config file, committed and
shared by the team. Per-user values are the plugin's `userConfig` (`plugin.json`), set when
the plugin is enabled and stored in the user's settings — never a repo file:

| `userConfig` key | Holds | Read as |
|---|---|---|
| `figma_tools` | Figma MCP tool names, comma-separated, preference order | `{figmaTools}` |

**Resolve:** walk up from the current directory (or from `{componentPath}`, once known) to the
first `.claude/design-system.json`. Its directory is `{projectRoot}`; every path in the file is
relative to it. A monorepo with two design systems has two files, one per project root.

## Example — Angular DS with role tokens

```json
{
  "version": 1,
  "name": "Nova UI",
  "framework": "angular",
  "prefix": "nv",
  "paths": {
    "root": "libs/ui",
    "components": "libs/ui/src/lib/components",
    "importPath": "@nova/ui/{componentDir}"
  },
  "publicApi": {
    "rootBarrel": "libs/ui/src/index.ts",
    "rootExport": "export * from './lib/components/{componentDir}';"
  },
  "tokens": {
    "sources": ["libs/ui/src/styles/roles.scss"],
    "allowed": ["--fill-*", "--content-*", "--border-*", "--shadow-*", "--radius-*"],
    "forbidden": ["libs/ui/src/styles/palette.scss"],
    "themeClass": "{prefix}-theme"
  },
  "sources": {
    "primitives": ["@angular/cdk", "ng-primitives"],
    "references": ["angular-material"]
  },
  "stacks": {
    "angular": { "skill": "angular-developer" },
    "css": { "skill": "css-styling" }
  }
}
```

## Example — React DS with no tokens yet

```json
{
  "version": 1,
  "name": "Shop Kit",
  "framework": "react",
  "prefix": "sk",
  "paths": { "root": "packages/kit", "components": "packages/kit/src/components" },
  "tokens": { "sources": [] }
}
```

`tokens.sources: []` does not switch token-only styling off. The component declares its own
custom properties, per [Universal rules](#universal-rules).

## Keys

| Key | Values | Default |
|---|---|---|
| `version` | `1` | required |
| `name` | design-system display name | required |
| `framework` | `angular` · `react` | required |
| `prefix` | kebab-case prefix, may be `""` | required |
| `naming.componentDir` | pattern | `{prefix}-{name}` |
| `naming.selector` | pattern | `{prefix}-{name}` |
| `naming.className` | pattern | angular `{Prefix}{Name}Component` · react `{Prefix}{Name}` |
| `naming.fileBase` | pattern | angular `{prefix}-{name}.component` · react `{Prefix}{Name}` |
| `paths.root` | DS library root | required |
| `paths.components` | components root | required |
| `paths.docs` | component docs folder, relative to `{componentPath}` | `docs` |
| `paths.plans` | plan folder pattern | `.claude/plans/{nnn}-{componentDir}` |
| `paths.importPath` | consumer import pattern | — (read from a neighbour's export) |
| `publicApi.perComponent` | each component has `index.ts` + `public-api.ts` | `true` |
| `publicApi.rootBarrel` | path · `null` | `null` (no root registration) |
| `publicApi.rootExport` | export-line pattern | `export * from './{relativePath}';` |
| `tokens.sources` | token-defining files | required, may be `[]` |
| `tokens.allowed` | custom-property globs a component may use | `[]` (any token from `sources`) |
| `tokens.forbidden` | files or globs a component must not reference | `[]` |
| `tokens.figmaToCss` | `{ separator, prefix }` | `{ "separator": "-", "prefix": "--" }` |
| `tokens.themeClass` | pattern · `null` | `null` |
| `tokens.motion` | motion custom-property globs | `[]` (use the fallback table) |
| `styles.language` | `scss` · `css` · `css-modules` | angular `scss` · react `css-modules` |
| `sources.primitives` | ordered behavior libraries | by `framework` (below) |
| `sources.references` | reference libraries (inspiration only) | by `framework` (below) |
| `sources.a11y` | extra a11y sources (URLs or repo paths) | `[]` |
| `sources.conventions` | in-repo docs the DS documents itself in | `[]` |
| `sources.storybook` | in-repo story conventions or exemplar stories | `[]` |
| `sources.siblings` | exemplar components to copy structure from | `[]` |
| `figma.project` | path to `figma-project.json` | `.claude/figma-project.json` when present |
| `a11y.wcag` | `2.1-AA` · `2.2-AA` · `2.2-AAA` | `2.2-AA` |
| `storybook.enabled` | boolean | `true` when Storybook is installed |
| `storybook.dir` | stories folder, relative to `{componentPath}` | `storybook` |
| `commands.test` | command the user runs | — |
| `commands.storybook` | command the user runs | — |
| `stacks.<stack>.skill` | convention skill name · `null` | `null` |
| `capabilities.<name>.skill` | skill name · `null` | `null` |
| `stages.review.skill` | skill name · `none` · `null` | `null` (built-in reviewer dispatch) |

Unknown key or value: stop and name it. A misconfigured value is a setup error, not a runtime
one — it fires on first run, every run.

### Slots

The plugin depends on no skill outside an installed plugin. What an org would swap is a slot;
a reference file the plugin's own steps read is vendored into the plugin; plugin agents
(`design-system:ds-*`) and the `code-review:*-reviewer` agents are fixed.

| Slot | Used by | `null` means |
|---|---|---|
| `stacks.{framework}.skill` | component, storybook scaffolders | `{conventions}` + plugin references only |
| `stacks.css.skill` | styles scaffolder, styles review | same |
| `stacks.test.skill` | test scaffolder | same |
| `stacks.storybook.skill` | storybook scaffolder | same |
| `capabilities.prototype.skill` | `/ds-interview`, `/ds-spec` | no prototype offer |
| `capabilities.map.skill` | `/ds-wayfinder` map mode | map mode not offered |
| `capabilities.codeConnect.skill` | `/ds-plan`, `/ds-ship` | Code Connect step lists the work, names no skill |
| `stages.review.skill` | Phase 6 | `/ds-review` dispatches the `code-review:*-reviewer` agents |

- **A slot names a skill that isn't installed:** stop and name it — setup error.
- **A stack skill and `{conventions}` disagree:** `{conventions}` wins.
- **`stages.review.skill` set:** `/ds-review` runs that skill instead of its own dispatch,
  with the same inputs (`/ds-review` § Review stage), and records its findings the same way.
- **`stages.review.skill: "none"`:** Phase 6 is skipped; `/ds-ship` runs next.

### `sources` defaults

Library ids resolve against the catalogs in
`${CLAUDE_PLUGIN_ROOT}/skills/ds-discovery/references/primitives.{framework}.md`. An id the
catalog doesn't list is still valid — the discovery agent researches it from its own docs.

| `framework` | `primitives` | `references` |
|---|---|---|
| `angular` | `["@angular/cdk", "ng-primitives"]` | `["angular-material"]` |
| `react` | `["react-aria", "@radix-ui"]` | `["mui", "radix-themes"]` |

The order is the discovery order: the first library that covers the pattern wins.

## Placeholders

Every skill, reference and agent uses these, resolved from the merged config. Never write a
concrete prefix, path or token family in plugin files.

| Placeholder | Resolves to |
|---|---|
| `{prefix}` · `{Prefix}` · `{PREFIX}` | `prefix` as kebab · Pascal · UPPER_SNAKE |
| `{name}` · `{Name}` | component name as kebab · Pascal |
| `{componentDir}` | `naming.componentDir`, rendered |
| `{selector}` · `{ClassName}` · `{fileBase}` | `naming.*`, rendered |
| `{dsRoot}` | `paths.root` |
| `{componentsRoot}` | `paths.components` |
| `{componentPath}` | `{componentsRoot}/{componentDir}/` — always ends with `/` |
| `{docsDir}` | `{componentPath}{paths.docs}/` |
| `{plansDir}` | `paths.plans`, rendered; `{nnn}` = next free 3-digit number |
| `{importPath}` | `paths.importPath`, rendered |
| `{publicApiBarrel}` | `publicApi.rootBarrel` |
| `{themeClass}` | `tokens.themeClass`, rendered (empty when `null`) |
| `{conventions}` | `{projectRoot}/docs/agents/design-system.md` |
| `{frameworkSkill}` | `stacks.{framework}.skill` (empty when `null`) |
| `{figmaTools}` | `userConfig.figma_tools` split on commas; empty → `ToolSearch("figma")` |

`{figmaTools}` is filled by the skill that dispatches discovery: `${user_config.*}` is
substituted only in skill and agent files, not in references read with Read.

## Universal rules

True for every design system; not configurable.

- **Token-only styling.** Color, shadow, radius, spacing and motion come from tokens. When
  `tokens.sources` is empty, the component declares its own custom properties on its root and
  uses only those — never a raw value in a rule body.
- **Atomic composition.** Components are composable atoms; content that could ever hold rich
  markup is projected, not a string prop (`component-api.md`).
- **Accessibility from live sources.** APG and WCAG are fetched, never recalled; `a11y.wcag`
  sets the target level.
- **Reduced motion** is always honoured; **logical CSS properties** over physical.
- **Core-minimal first**, steps ordered by a dependency graph.
- **Reference libraries are inspiration only** — never copied.

## Reading it

- **No `design-system.json`:** `/ds-wayfinder` and `/ds-discovery` run `/ds-setup`. Any other
  phase stops and points to `/ds-setup`.
- **Legacy `ds-wayfinder.config.json` found:** `/ds-setup` migrates it; phases do not read it.
- **`design-system.local.json` or a `figma.tools` key found:** setup error — `/ds-setup` removes
  them and gives the user the `figma_tools` value to set in `/config`.
- **No `docs/agents/design-system.md`:** same as a missing config.
- **A conventions-doc rule contradicts a plugin reference:** the conventions doc wins — it
  describes this design system; the reference describes the framework default.
