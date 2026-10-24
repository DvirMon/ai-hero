# Discovery Phase — Reading the Figma Design

Always Phase 1. Fetch the Figma design once; every later phase consumes this output.

## Fetching the Design

### Primary: Figma MCP

Call the first available tool in `{figmaTools}` (none configured → `ToolSearch("figma")` and
use what is connected) with the file key and node ID from the Figma URL. Prefer a tool that
returns design context with variables over a raw node dump.

### Fallback 1: Figma REST API (MCP unavailable)

Ask the user to run the call locally and paste the response:

> "The Figma MCP is not available. Run this with a Figma personal access token (read-only
> scope — figma.com → Account Settings → Personal access tokens):
>
> ```sh
> curl -s -H "X-Figma-Token: <token>" \
>   "https://api.figma.com/v1/files/:fileKey/nodes?ids=:nodeId"
> ```
>
> Paste the JSON response — not the token."

Extract the same information as from the MCP output.

### Fallback 2: No Figma (pre-design)

Don't block:

1. Find the **most similar existing DS component** in `{componentsRoot}` (start with
   `sources.siblings`).
2. Read its styles, template and public API.
3. Use it as the structural and token reference.
4. State in the summary: "No Figma available — pattern derived from `<component>`."

Read the full output before doing anything else.

## What to Extract

### From the screenshot
- Every **visual state**: default, hover, focus, active, disabled, error, loading, empty
- Every **variant** dimension (appearance, size, color/intent) and its values
- **Layout regions** (header, body, footer, actions, icon slot)
- **Decorative** vs **interactive** icons

### From variant names → candidate inputs

| Figma variant property | Maps to |
|---|---|
| `Type=Primary,Secondary,Danger` | enum input `appearance`, default `primary` |
| `Size=SM,MD,LG` | enum input `size`, default `md` |
| `Color=Brand,Danger,Success` | enum input `color`, default `brand` |
| `Show Icon=True/False` | boolean input `showIcon`, default `false` |
| `Disabled=True/False` | boolean input `disabled`, default `false` |
| `State=Default,Hover,Error` | **not an input** — CSS pseudo-class or state class |
| `Loading=True/False` | boolean input only if it changes structure |

Hover and focus are always CSS pseudo-classes. Error and loading become inputs only when they
change the DOM (e.g. a spinner), not just the color. Framework syntax: `component-api.{framework}.md`.

### From variable references
Record every token a layer references, converted with `tokens.figmaToCss`: split the Figma path
on `/`, join with `separator`, add `prefix` — with the defaults, `fill/brand/bold` →
`var(--fill-brand-bold)`. Check each converted name exists in `tokens.sources`; flag misses and
anything matching `tokens.forbidden`. With `tokens.sources: []`, record the raw values — the
component will declare its own custom properties for them.

### From component descriptions
Designer notes: intended use, what NOT to use it for, linked specs.

## Reference library discovery

For components with **interactive behaviour** (overlays, keyboard navigation, focus
management), study the equivalent in each `sources.references` library before Phase 2 —
**inspiration only**, never copied. Use it to learn which primitive it uses, which ARIA pattern
it follows and how it shapes its public API. Catalog URLs and adaptation tables:
`primitives.md` + `primitives.{framework}.md`.

Skip for purely presentational components (cards, badges, dividers).

## Output: Discovery Summary

```
Component: {name}
Variants: [dimensions and values]
States: [default, hover, focus, disabled, error, …]
Candidate inputs: [name: type = default, …]
Tokens: [converted CSS custom properties; flagged misses]
Content regions: [named regions that may become slots]
Primitive candidate: [library + primitive, or "none"]
A11y role: [initial guess]
Motion: [observed animations, or "none"]
Reference equivalent: [library: component, or "none"]
internalDsComponents:
  - component: <DS component>
    selector: <selector from source>
    importPath: <import path from its export>
    usedFor: <purpose>
  # "none" when the component uses no existing DS components
```
