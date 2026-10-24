# Story config

`<repo>/.claude/story.json` — one per repo, written by `/story:setup`. Every stage skill and
agent resolves it first.

It holds **values**: which sources discovery reads, where stories and their docs live, and
which skills each stage loads. The plugin holds only what is true for every stack. Anything one
stack or project does differently goes here or in the project's conventions doc, never in a
plugin skill.

## Files and layering

| Layer | Path | Owner | Git |
|---|---|---|---|
| 1. team | `<repo>/.claude/story.json` | the repo | committed |
| 2. user | `<repo>/.claude/story.local.json` | one teammate | gitignored |
| 3. env | `STORY_*` | CI / one run | — |

Later layers win. **Merge:** objects merge key by key; arrays and scalars replace.

**Env:** `STORY_` + the key path in upper case, `__` between levels, `-` → `_`. The value is
parsed as JSON when it parses, otherwise it is a string.

    STORY_PROJECTS__TABLE__SOURCES__ANCHORS='["data-grid / table"]'

## Example — Angular library with a domain

```json
{
  "version": 1,
  "projects": {
    "table": {
      "path": "libs/shared/table/**",
      "domainDir": "libs/shared/table",
      "paths": {
        "stories": "{domainDir}/src/stories/{story}/",
        "host": "*-story-host.component.ts"
      },
      "docs": { "conventions": "{domainDir}/docs/3-ui/stories.md" },
      "sources": {
        "anchors": ["data-grid / table"],
        "packages": ["ag-grid-community", "@tanstack/table-core", "primeng"],
        "internal": ["{domainDir}/src/stories/**"]
      },
      "skills": {
        "create": ["story:stack-angular"],
        "implement": ["angular-developer", "story:stack-angular"]
      },
      "typecheck": "nx run table:typecheck"
    }
  }
}
```

## Example — monorepo with a React design system

```json
{
  "version": 1,
  "projects": {
    "kit": {
      "path": "packages/kit/**",
      "domainDir": "packages/kit/src/components/{component}",
      "paths": { "stories": "{domainDir}/storybook/", "host": "*.stories.tsx" },
      "sources": {
        "anchors": ["design-system components"],
        "packages": ["@mui/material", "@radix-ui/themes"]
      },
      "skills": {
        "create": ["story:stack-react"],
        "implement": ["react-developer", "story:stack-react"]
      }
    },
    "web": {
      "path": "apps/web/**",
      "skills": { "implement": ["react-developer", "story:stack-react"] }
    }
  }
}
```

## Keys

| Key | Values | Default |
|---|---|---|
| `version` | `1` | required |
| `projects` | map of name → project (below) | required; setup writes one per project it finds |

### Projects

| Key | Values | Default |
|---|---|---|
| `path` | glob, or array of globs, relative to the repo root | required |
| `domainDir` | path template — the folder that owns a domain's docs and stories | the folder of the matched file's nearest `docs/` |
| `paths.prd` | path template | `{domainDir}/docs/prd.md` |
| `paths.stories` | path template, `{story}` = story slug | `{domainDir}/stories/{story}/` |
| `paths.host` | glob for the file that wires a story (host component, `.stories.*`) | `*.stories.*` |
| `paths.specs` | path template for story specs | `{domainDir}/docs/stories/{story}.story.md` |
| `docs.conventions` | path template — the project's story-conventions doc | — (none; `/story:docs` offers to write one) |
| `docs.plan` | path template — where `/story:plan` writes its plan | — (ask) |
| `sources.anchors` | array of section titles in the anchors file | `[]` |
| `sources.anchorsFile` | path | `~/.claude/discovery-sources.md` |
| `sources.packages` | array of npm package names or URLs — peers whose rendered affordances discovery compares | `[]` |
| `sources.internal` | array of globs — this repo's stories, demos and docs discovery audits | `["{domainDir}/**"]` |
| `skills.<stage>` | array of skill names, loaded by that stage | `[]` |
| `typecheck` | command | the project's own tsconfig (`typecheck-with-project-config`) |

`<stage>`: `discovery` · `plan` · `create` · `implement` · `docs`.

- **Matching.** A path belongs to the first project, in listed order, whose `path` matches it.
  List the more specific project first. A single-project repo uses `"path": "**"`.
- **`sources`** is one shape for every kind of project. A table library lists table libraries; a
  design system lists component libraries. `packages` are *peers to compare against*, not the
  libraries a project is built on — a design system's primitives stay in that plugin's config
  (`design-system.json` `sources.primitives`). Story never reads `design-system.json`.
- **`sources` empty** is valid: discovery runs fully open and proposes anchors in its report.
- **`skills`** are conventions, not executors. The stage loads them before writing anything.
  `skills.create` / `skills.implement` carry the stack: `story:stack-angular`,
  `story:stack-react`, or any installed skill (a Vue repo names its own).
- **`skills.create` empty:** `/story:create` applies the framework-agnostic core only and says
  in its report that no stack skill was named.
- **`domainDir` with a placeholder** (`{component}`): the stage fills it from the target the
  user named; unresolvable → ask once.

## Placeholders

| Placeholder | Resolves to |
|---|---|
| `{domainDir}` | `domainDir`, rendered |
| `{story}` | story slug, kebab-case, named by capability (`gated-edit`, not `with-button`) |
| `{prd}` · `{stories}` · `{specs}` | `paths.*`, rendered |
| `{conventions}` | `docs.conventions`, rendered; empty when unset |

## Reading it

Every stage resolves the config first: read the three layers, merge, apply defaults.

- **No `story.json`:** `/story:discovery`, `/story:plan` and `/story:create` run
  `/story:setup`. The `story:implementer` agent stops `blocked` — it has no channel to the user.
- **Unknown key or value:** stop and name it. A misconfigured value is a setup error, not a
  runtime one — it fires on first run, every run.
- **A path no project matches**, or a skill a project names that isn't installed: stop, name the
  path or skill and the project.
- **`docs.conventions` set but the file is missing:** stop and name it.
- **A stack skill and `{conventions}` disagree:** `{conventions}` wins — it is the project's own
  instance of the pattern.
