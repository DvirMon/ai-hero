# Unmapped-node audit

Decide which code component each Figma node becomes **before any code is written**. Shared by
`figma-feature-implementation` (at implement time) and the `figma-frame-discovery` agent (at
grill time, where it only lists candidates and never decides).

Inputs: `get_design_context` output for the node, the [project config](project-config.md).

## 1. Split the nodes

- **Mapped** — inside a `CodeConnectSnippet`. Its selector is the spec. Only possible when
  `codeConnect.available` is `true`.
- **Candidate component** — a node that meets **all three**:
  1. a `data-name` that names a UI role (`Alert`, `Session row`, `Callout`)
  2. visual tokens: fill, border, elevation, or a radius plus one of those
  3. not inside a mapped parent
- **Not a candidate** — pure layout (`flex`/`gap`/`grid` only), typography-only, structural
  wrappers. They become markup + utilities, never a component.

With `codeConnect.available: false`, every visually tokenized named node is a candidate.

## 2. Find up to 3 candidates per node

Follow `designSystem.lookup`:

- `mcp` — call the listed tools with the node's visual role as the keyword.
- `grep` — search the listed paths for the role (`rg -il "<role>" <paths>`), then confirm the
  selector carries `designSystem.selectorPrefix`.

Seed from `designSystem.componentMap`. No candidate → mark it `custom markup` or
`new DS component` (the latter routes to `designSystem.newComponent`).

## 3. Ask, batched

One structured question per node, up to 4 nodes per call. Each option shows the usage snippet
so the developer compares code, not names:

```
Node 'Session row' has no component mapping. Which should it be?
  • <v-card> …                 ← candidate
  • custom markup from tokens
  • new DS component            → designSystem.newComponent
  • plain layout wrapper
```

A confirmed answer has the same weight as a Code Connect hit: no raw-div fallback for it later.

## 4. Record

At **grill**, `figma-frame-discovery` writes candidates only to
`design.draft/{nodeId}.md` ([frame-discovery-output.md](frame-discovery-output.md)). After
grill questions, the orchestrator merges **decisions** into the ticket's `design.md` (one row per
node: node ID → component → why), per `traceability`. A decision held only in chat is lost when
the context window rolls over.
