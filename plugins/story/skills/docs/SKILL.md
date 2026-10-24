---
name: docs
description: "The docs stage of the story pipeline. Brings a project's Storybook story docs in line: the doc comment on each story host / `.stories.*` export (per contracts/story-doc.md), the `.mdx` wrappers (thin: Meta/Canvas/Source), and the project's story-conventions doc at `docs.conventions` in .claude/story.json — written or refreshed from the stories that actually exist. Audit mode reports deviations and edits nothing; apply mode fixes them. Use after story:implementer lands a story, or when asked to audit/fix story doc comments, tighten story .mdx files, or write/refresh the story-conventions doc."
---

# Story docs

Owns three things for the stories of one project:

| Owns | Rule source | Lives at |
|---|---|---|
| Doc comment on each host / `.stories.*` export | `${CLAUDE_PLUGIN_ROOT}/contracts/story-doc.md` | the host file |
| `.mdx` wrapper | § `.mdx` wrappers below + `skills.docs` | next to the story |
| Story-conventions doc | § Conventions doc below | `docs.conventions` |

Does not decide which stories exist (`/story:plan`), design one (`/story:create`), or write
story code (`story:implementer`).

## 1. Resolve config

Read `.claude/story.json` per `${CLAUDE_PLUGIN_ROOT}/contracts/story-config.md` — three layers,
merged, defaults applied.

- Missing → run `/story:setup`, then continue.
- Unknown key, unmatched path, uninstalled skill, `docs.conventions` set but file missing →
  stop and name it.
- Match the target to its project. No target named → ask which project or story.

## 2. Load skills

Load every skill in `skills.docs` before reading or writing anything. They carry the stack
specifics: `.mdx` imports, doc-block syntax, source-panel overrides.

Then read `{conventions}` if set. It wins over a stack skill when they disagree.

Empty `skills.docs` → apply the stack-neutral rules here only; say so in the report.

## 3. Pick mode

| Mode | Trigger | Edits |
|---|---|---|
| audit | "audit", "check", "review", no verb | none — report only |
| apply | "fix", "apply", "write", "refresh", after `story:implementer` | in place |

Unclear → audit. Apply never broadens beyond the story set named.

## 4. Scope

- A story slug → that story's folder under `paths.stories`.
- A project → every file matching `paths.host` plus every `.mdx` under its stories root.
- The conventions doc is in scope only when asked for, or when it is unset/stale (§ Conventions doc).

## 5. Doc comments

For each host / `.stories.*` export in scope, check the block against `story-doc.md`:

| Check | Deviation |
|---|---|
| Present | no block on a host or exported story |
| Shape | Title / Demonstrates / optional Caveat, in order |
| Budget | over 8 lines or 60 words; over 10 lines is a hard fail |
| Title | not a 3-8 word noun phrase; starts "This story…" |
| Demonstrates | names no API; interactive story with no concrete action |
| Forbidden | rationale, ADR / D-numbers, peer comparison, internals, restated code |

A story spec at `paths.specs` with a `## Doc comment` section is the source text. Copy it;
don't rewrite it. A block that differs from its spec is a deviation either way — report which
side is wrong.

Rationale removed from a block is not lost: move it to the conventions doc or an ADR, or name
it in the report for the user to place.

## 6. `.mdx` wrappers

Stack-neutral rules. `skills.docs` supplies the syntax.

- **Thin wrapper.** Meta, Canvas per story, Source. Plus any shared block the project's other
  `.mdx` files already reuse.
- **No restating.** What the story proves lives in the doc comment, not the `.mdx`.
- **Prose only for a non-obvious why** a reader needs before the code — a deliberate
  composition choice, a setup step outside the canvas. Never a description of what is visible.
- **One `.mdx` per story folder**, when the project uses `.mdx` at all. A project with none
  doesn't get them added.
- **External mechanism shown in Source.** When the behavior lives outside the render (a style
  file, a token override, a sibling fixture), Source shows both pieces. How depends on the stack
  skill.

## 7. Conventions doc

The project's own record of how its stories are built. `/story:plan` and `/story:create` read
it; it wins over stack skills.

Write it from the stories that exist — never from this skill or a stack skill's defaults.

| Section | Derive from |
|---|---|
| File layout | the actual story folders: files per story, shared fixtures and where they sit |
| Host naming | host file and class / export names in use |
| Doc comment | link to `story-doc.md`; local additions only |
| `.mdx` | the shared blocks real `.mdx` files reuse |
| Mocking | how buttons mutate state; how network round-trips are simulated (e.g. request interception vs. plain await) and when each is used |
| Controls | which args are wired as controls, and the naming they follow |
| Reference implementations | 2-4 real stories, each with the one pattern it shows best |

Rules:

- Every claim cites a real file. A pattern seen in one story only is not a convention — list it
  as an exception or leave it out.
- Stories that disagree → record the majority, list the outliers, and ask which wins. Don't
  pick silently.
- Refresh = diff the doc against the stories now. Keep sections still true, fix stale ones,
  drop references to deleted stories.

**`docs.conventions` unset:**

- audit → report "no conventions doc" and offer to write one.
- apply → ask where. Default suggestion: `{domainDir}/docs/stories.md`. Write it, then tell the
  user to add the path to `.claude/story.json` as `projects.<p>.docs.conventions`. Never edit
  `story.json` yourself.

## 8. Report

Audit:

```
<file>:<line> — <check> — <deviation> — <fix>
```

Group by file. End with counts per check, and the conventions-doc status (current / stale /
missing).

Apply: files written, per-file line delta, anything left for the user (rationale to place,
conflicts to decide, the `story.json` key to add).

## 9. Compress

Apply mode only. After every write, dispatch the `doc-compressor` agent **once**, on exactly
the files this run wrote. Not available → skip, and say so. Never a second dispatch, never on
files this run didn't touch.

Doc comments stay inside the `story-doc.md` budget after compression; the conventions doc keeps
every cited file path.
