# Design-system conventions doc

`<project>/docs/agents/design-system.md` (`{conventions}`) — written by `/ds-setup`, edited by
the team. It records how **this** design system builds components, in prose and code shapes
that don't fit in JSON. Values (paths, prefix, token globs, source lists) stay in
[`ds-config.md`](ds-config.md)'s `design-system.json`; this doc never repeats them.

Phase skills and agents read the sections they need; the reviewer reads `## Review rules`.

## Required sections

Every heading below must exist. A section setup could not ground in the repo says
`Not established — <what the plugin default does instead>` rather than being dropped.

| Section | Holds | Read by |
|---|---|---|
| `## Component shape` | the root element, what goes on it (selector class, theme class, variant/state classes, ARIA), change detection / memoization, base classes | scaffold, review, codebase discovery |
| `## Types and exports` | where public types live, the per-component export shape, root registration | scaffold, review, ship |
| `## File layout` | the files one component has, their names, extra folders (`docs/`, `storybook/`, `examples/`) | plan, scaffold, codebase discovery |
| `## API conventions` | input/prop naming, slot selection style, behavior-unit naming (directive selectors, hook names), forms integration | interview, scaffold |
| `## Styling` | how tokens are consumed, the override API (shape, size limit), encapsulation, forbidden escape hatches, units | styles scaffold, review |
| `## Building blocks` | internal components and services new components must reuse — icon (and its key format), button, overlay/portal, focus helpers | discovery, scaffold, review |
| `## Tests` | runner, file name, what is tested, input-driving idiom | test scaffold |
| `## Review rules` | numbered DS-specific rules, each one checkable | review |

Storybook conventions are not a section here. They live in the story-conventions doc the DS
project's `.claude/story.json` entry names at `docs.conventions` (`story` plugin), read by
`/story:create`, `story:implementer` and `/story:docs`.

## Section format

```markdown
## Component shape

- Root element carries `{selector}` and `{themeClass}` as classes.
- Variant/state classes bind on the root, never on inner markup.

Evidence: `libs/ui/src/lib/components/nv-banner/nv-banner.component.ts`
```

- **Rules are imperative and checkable** — "Variant classes bind on the root", not "consider
  where classes go".
- **Every section ends with `Evidence:`** — the repo files the rules were read from. A rule with
  no evidence was decided by the team at setup; mark it `(team decision)`.
- **Use the config placeholders** (`{selector}`, `{themeClass}`, `{prefix}`) instead of repeating
  values, so a rename in `design-system.json` doesn't leave this doc stale.
- **Review rules are numbered** and cited as `{conventions} § Review rules #N`.

## Precedence

`{conventions}` > plugin references > framework defaults. A plugin reference that contradicts
this doc is the bug, not the doc — follow the doc and say so.
