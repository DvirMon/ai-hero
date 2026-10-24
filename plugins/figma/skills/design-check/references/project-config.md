# Figma project config

Every `figma-*` skill reads project facts from one file instead of hardcoding them:

```
{repoRoot}/.claude/figma-project.json
```

Resolve it by walking up from the current directory to the first `.claude/figma-project.json`.
Not `figma.config.json` — that name belongs to the Code Connect CLI.

**Missing config is a construction error: stop.** Don't guess a stack from `package.json` and
continue, since a wrong selector prefix or token system yields code that looks right and isn't.
Tell the user the file is missing, offer to draft it from the example in
[examples/](examples/), and wait for confirmation before writing it.

## Schema (`schemaVersion: 1`)

| Key | Meaning |
|---|---|
| `project`, `stack` | Name; `angular` / `react`. Picks the developer skill (`angular-developer` / `react-developer`). |
| `rules[]` | Repo files that win over anything in these skills (e.g. an area `AGENTS.md`). Read before the first edit. |
| `designSystem.selectorPrefix` | `v-`, `atera-`, … — the only prefix a DS selector may carry. |
| `designSystem.package` / `path` | Where the DS components live (npm package or in-repo lib). |
| `designSystem.lookup` | How to find a component for an unmapped node: `{ "kind": "mcp", "tools": [...] }` or `{ "kind": "grep", "paths": [...] }`. |
| `designSystem.componentMap[]` | `{ figma, code }` reference rows. Below Code Connect and developer confirmations in precedence. |
| `designSystem.newComponent` | What to do when no DS component fits (skill or flow name). Never a local one-off. |
| `tokens.system` | `css-vars` (`var(--fill-…)`) or `scss-vars` (`$nf-blue-100` + utility classes). |
| `tokens.sources[]` | Files that define the tokens — grep these, don't recall them. |
| `tokens.figmaNameRule` | How a Figma variable name becomes a code token, with one worked example. |
| `tokens.tierCheck` | Optional role-vs-palette rule (`css-vars` systems with role tokens). |
| `tokens.missing` | What to do when no token matches: `local-scss-var` / `ask` / `role-upgrade`. |
| `utilities.prefix` / `config` | Tailwind prefix (`tw-` or empty) and its config file (spacing scale, radius). |
| `typography` | `{ kind, source, classes?, status }` — `classes` (named text classes), `mixins`, or `utility-sizes`. `status: "partial"` means Figma text styles have no 1:1 name yet. |
| `icons` | `{ usage, fallback?, missing }` — the icon element and the skill for a missing glyph. |
| `i18n` | `{ file, pipe, keyCase, skill? }`. |
| `codeConnect` | `{ available, reason?, figmaFileKey?, scripts? }`. `false` means no `CodeConnectSnippet` will appear — every mapping goes through the [unmapped-node audit](unmapped-node-audit.md). |
| `traceability` | Where Figma node IDs are recorded. Code comments are never a valid answer. |
| `extraChecks[]` | Project-only finish-line checks (RTL logical properties, tracking directives, `data-testid`, …). |

Unknown keys are ignored; a missing **required** key (`stack`, `designSystem.selectorPrefix`,
`tokens.system`, `tokens.sources`, `i18n.file`, `codeConnect.available`) is the same stop as a
missing file.

## Precedence

`config.rules[]` files > this config > skill defaults. When a skill step and a repo rule disagree,
the repo rule wins and the skill step is the bug — say so.
