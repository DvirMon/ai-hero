# Research Phase — Reading the Figma Design

This is always Phase 1. Fetch the Figma design once. All subsequent planning steps consume this output.

## Fetching the Design

### Primary: Figma MCP

Call `mcp__{prefix}-ui-mcp__getFigmaData` or `mcp__{prefix}-ui-mcp__getFigmaFileNodes` with the node ID and file key from the Figma URL.

### Fallback 1: Figma REST API (when MCP is unavailable)

If the MCP tool fails or is unavailable, fall back to the Figma REST API directly.

**Instruct the user to run the API call locally and paste the response:**

> "The Figma MCP is not available. To fetch the design via the Figma REST API, run the following command in your terminal (replace `<token>` with a Figma personal access token — generate one at figma.com → Account Settings → Personal access tokens → read-only scope):
>
> ```sh
> curl -s -H "X-Figma-Token: <token>" \
>   "https://api.figma.com/v1/files/:fileKey/nodes?ids=:nodeId"
> ```
>
> Paste the JSON response here — do not paste the token itself."

Extract the same information from the JSON response as you would from the MCP output.

### Fallback 2: No Figma available (designer in MVP / pre-design phase)

If no Figma URL exists and the designer has not yet created a component frame, do not block. Instead:

1. Search the existing codebase for the **most similar DS component** already built (e.g. if building a "stat card", look for `{prefix}-card`, `{prefix}-content-block`, or any existing card-like component).
2. Read its SCSS, template, and public API to understand the established pattern.
3. Use that component as the structural and token reference instead of a Figma frame.
4. Clearly note in the research summary: "No Figma available — pattern derived from `<existing-component>`."

This ensures the new component is consistent with existing DS patterns even without a design spec.

Read the full output before doing anything else.

## What to Extract

### From the screenshot
- All **visual states**: default, hover, focus, active, disabled, error, loading, empty
- All **variants**: how many exist, what dimension they control (appearance, size, color/intent)
- **Layout regions**: which areas are distinct (header, body, footer, actions, icon slot)
- Whether icons are **decorative** (purely visual) or **interactive** (clickable)

### From variant names → candidate inputs

| Figma variant property | Maps to |
|---|---|
| `Type=Primary,Secondary,Danger` | `appearance = input<Appearance>('primary')` |
| `Size=SM,MD,LG` | `size = input<Size>('md')` |
| `Color=Brand,Danger,Success` | `color = input<Color>('brand')` |
| `Show Icon=True/False` | `showIcon = input(false)` |
| `Disabled=True/False` | `disabled = input(false)` |
| `State=Default,Hover,Error` | **Not an input** — CSS pseudo-class or state class |
| `Loading=True/False` | `loading = input(false)` if it changes structure |

**Rule:** Hover and focus are always CSS pseudo-classes, never inputs. Error and loading may be inputs only if they change the DOM structure (e.g. show a spinner), not just the color.

### From CSS variable references
Note every token referenced in the Figma layer. They map directly to SCSS variables.

Format: Figma `fill/brand/bold` → CSS `var(--fill-brand-bold)` (replace `/` with `-`)

### From component descriptions
Designers often leave usage notes in the Figma component description. Extract:
- Intended use cases
- What NOT to use it for
- Links to documentation or specs

## Angular Material Research (optional but recommended)

For any component with **interactive behaviour** (dropdowns, dialogs, overlays, keyboard navigation, focus management), research the equivalent Angular Material component **before** Phase 2 planning.

Angular Material is **inspiration only** — never copy its code directly. It uses outdated Angular patterns (`@Input`, `NgModule`, `ngOnInit`). Use it to understand:
- Which CDK primitives it uses
- What ARIA pattern it follows
- How it structures its public API

→ See [primitives.md](primitives.md) (agnostic) and [primitives.angular.md](primitives.angular.md) for the full Material reference URLs and the adaptation rules.

**Skip this step** for purely presentational components (cards, badges, banners, dividers) with no interactive behaviour.

## Output: Research Summary

Before moving to Phase 2, produce this structured summary. It feeds all three parallel planning steps.

```
Component: <name>
Variants: [list all variant dimensions and their values]
States: [list: default, hover, focus, disabled, error, etc.]
Candidate inputs: [name: type = default, ...]
Tokens: [list of CSS vars referenced in Figma]
Content regions: [named regions that may become ng-content slots]
CDK candidate: [initial guess based on interaction pattern]
A11y role: [initial guess: button, dialog, listbox, etc.]
Motion: [any animations observed in the design: open/close, hover transitions, etc.]
Material equivalent: [Angular Material component name, or "none"]
internalDsComponents:
  - component: {prefix}-button
    selector: button[{prefix}-button]
    importPath: "@{NAMESPACE}/ui-core/2.0/{prefix}-button"
    usedFor: action buttons
  # write "none" if no existing DS components are used inside this component
```
