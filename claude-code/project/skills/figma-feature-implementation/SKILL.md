---
name: figma-feature-implementation
description: Implement a product feature UI from a Figma design. Covers the full workflow — fetching design context, identifying the right design system components via atera-ui-mcp, handling custom layout wrappers with correct tokens, generating Angular code, and wiring up translations.
---

# Figma Feature Implementation

Implement a product feature from a Figma design using existing Atera design system components.

## When to Use

- A Figma URL points to a screen, page, modal, panel, or UI section in the product
- The goal is to build or update a feature component in `apps/` or a feature library
- The design uses (or should use) existing design system components from `libs/shared/ui-core`

## Workflow

### Step 1 — Fetch the design

Call `mcp__claude_ai_Figma__get_design_context` with the node ID and file key from the URL.

Read the output carefully:
- **Screenshot** — understand the visual layout before touching code
- **Component descriptions** — Figma annotates known DS components; these are your primary signal
- **CSS variable references** — reveal which design tokens to use for custom containers

### Step 1.5 — Audit Code Connect coverage and disambiguate gaps

**Do this before writing any code.** Tally which nodes have Code Connect mappings and which don't.

#### Identify connected nodes
Every `CodeConnectSnippet` element in the output is a confirmed mapping. Note the selector it resolves to — treat it the same as a code specification.

#### Identify unconnected nodes
Flag a raw `<div>` block as a candidate unconnected component when it meets **all three**:
1. Has a `data-name` that sounds like a UI component (e.g. `data-name="Alert"`, `data-name="Integration card"`, `data-name="Callout"`)
2. Uses Figma design tokens for color, border, or elevation (`var(--fill\/...)`, `var(--border\/...)`, `shadow-[...]`)
3. Is not already inside a `CodeConnectSnippet` parent

**Do NOT flag** pure layout wrappers (only `flex`/`gap`/`grid`, no visual tokens), typography-only elements, or structural containers.

#### For each unconnected node, search for DS candidates

```
mcp__atera-ui-mcp__getSpecificAteraComponentDetailsByKeyword({ keyword: "<visual role>" })
```

Collect up to 3 candidates per node. If no candidates are found, mark the node as "generate custom markup".

#### Pause and ask the developer before proceeding

Use `AskUserQuestion` (supports 1–4 questions per call, batch multiple nodes together). Use the `preview` field on each option to show the Angular usage snippet so the developer can compare concretely.

```
Question: "Node '<data-name>' has no Code Connect mapping. Which DS component should I use?"

Options (with preview snippets):
  • <atera-banner variant="error">          ← candidate 1
  • <atera-callout type="danger">           ← candidate 2
  • Generate custom markup                  ← build from tokens
  • Treat as plain layout wrapper           ← skip, just a div
```

**Example:**

Figma output contains a raw div with `data-name="Alert"`:
```jsx
<div className="bg-[var(--fill\/danger\/subtle)] border border-[var(--border\/danger\/primary)] rounded-[6px]" data-name="Alert">
  <span>Something went wrong</span>
</div>
```

→ Search: `getSpecificAteraComponentDetailsByKeyword({ keyword: "danger alert banner" })`
→ Found: `atera-banner`, `atera-callout`
→ Ask developer via `AskUserQuestion`:
  - Option A (preview): `<atera-banner variant="error" [dismissible]="true">...</atera-banner>`
  - Option B (preview): `<atera-callout type="danger">...</atera-callout>`
  - Option C: Generate custom markup
  - Option D: Skip — treat as layout div

**Apply confirmed mappings in Step 2.** Any node the developer assigns to a DS component is treated the same as a Code Connect hit — no raw-div fallback allowed for it.

---

### Step 2 — Identify design system components

**Primary source: Code Connect + Step 1.5 confirmations.** Both are authoritative — use the confirmed selector directly with no further lookup.

```
✅ get_design_context returns a CodeConnectSnippet:  <atera-banner variant="error">
✅ Developer confirmed in Step 1.5:                  <atera-callout type="danger">
→ Use exactly that. Done.
```

**Fallback: `atera-ui-mcp`** — only for nodes that were not covered by Code Connect AND not shown to the developer in Step 1.5 (e.g. minor sub-elements discovered only during code generation). Then search by visual description:
- `getSpecificAteraComponentDetailsByKeyword` for targeted lookup
- `getAteraComponentsThroughStoriesMetadata` for broader browsing

Always prefer components from `libs/shared/ui-core/src/lib/components/2.0/`.

Common mappings (reference only — Code Connect and Step 1.5 confirmations take precedence):
| Figma element | Atera component |
|---|---|
| Button | `<button atera-button>` |
| Icon | `<atera-icon-2 key="..." size="md">` |
| Banner / alert bar | `<atera-banner variant="...">` |
| Text input | `<atera-input>` / `<mat-form-field>` |
| Checkbox | `<atera-checkbox>` |
| Toggle | `<atera-toggle>` |
| Badge / chip | `<atera-chip>` |
| Tooltip | `ateraTooltip` directive |

### Step 3 — Handle custom layout containers

For `<div>` wrappers and layout elements that are NOT DS components, convert Figma token references to Atera CSS variables.

**Token translation rule:** replace `/` with `-` in the Figma token name.

```
Figma: var(--fill\/danger\/subtle, #ffd5d2)
Atera: var(--fill-danger-subtle)
```

**Token tier check (mandatory after translation):** Figma may emit palette or primitive tokens instead of role tokens. After translating, check the prefix:

| Prefix | Tier | Action |
|---|---|---|
| `--fill-`, `--content-`, `--border-`, `--action-`, `--bg-`, `--shadow-` | Role ✅ | Use as-is |
| `--neutral-`, `--gray-`, `--blue-`, `--red-`, `--green-`, etc. | Palette/primitive ❌ | Upgrade to role token |

To upgrade a palette/primitive token:
1. Try `mcp__atera-ui-mcp__getAteraTokenByHexColor` with the fallback hex from the Figma output (e.g. `#ffd5d2`)
2. If MCP returns nothing, grep the source:
   ```bash
   # Step 1 — confirm which palette token holds the hex
   grep -n "<hex>" libs/shared/ui-core/src/lib/style/atera-theme-2/apa/apa-primitives.scss
   # Step 2 — find which role token maps to that palette token
   grep -n "<palette-token>" libs/shared/ui-core/src/lib/style/atera-theme-2/atera-roles.scss
   ```
3. Pick the role token whose semantic intent matches the element (e.g. `--content-neutral-primary` for body text, not `--content-invert-secondary` even if they share the same hex)

See the **Figma Token Mapping** section in the `css-styling` skill for the full reference table.

**Layout goes in Tailwind. Colors/borders go in SCSS.** Never create a CSS class just to wrap a `display: flex` or `gap`. Put those directly on the element as Tailwind utilities.

```html
<!-- ❌ Wrong — inventing CSS classes for pure layout -->
<div class="card-contents">...</div>
<!-- .card-contents { display: flex; flex-direction: column; gap: 24px; } -->

<!-- ✅ Correct — layout inline, SCSS only for tokens that need CSS variables -->
<div class="card-container flex flex-col gap-24">...</div>
<!-- .card-container { background: var(--fill-base); border: 1px solid var(--border-neutral-primary); } -->
```

### Step 4 — Generate Angular code

Follow the **`angular-dev-v21`** skill as the authority for all Angular code patterns — signals, reactivity, forms, routing, and component structure.

Key points specific to feature implementation from Figma:

**Translating Figma layout to Angular**
- Figma flex/grid → **Tailwind utility classes directly on the element** (`flex`, `grid`, `gap-16`, `items-center`)
- Figma spacing px → Tailwind scale: values in config (8, 10, 12, 16, 24, 40, 60…) map 1:1 — use `gap-16`, `p-24`. Values not in config use arbitrary syntax: `gap-[9px]`, `pt-[11px]`
- Figma border radius → `rounded-small` (4px) / `rounded-medium` (8px) — not raw px
- **Never create a CSS class whose only purpose is layout** — that logic belongs in Tailwind

**Translating Figma typography to Angular**
- Figma text styles → **v2.0 typography CSS classes**, not custom `font-size`/`font-weight` SCSS
- Available classes (defined in `typography-2.scss`):
  - Headings: `heading-xl-semi-bold` (42px), `heading-lg-semi-bold` (32px), `heading-md-semi-bold` (28px), `heading-sm-semi-bold` (24px), `heading-xs-semi-bold` (20px)
  - Body: `body-lg-medium` (16px/500), `body-lg-regular` (16px/400), `body-md-medium` (14px/500), `body-md-regular` (14px/400)
  - Caption: `caption-sm-medium` (12px/500), `caption-sm-regular` (12px/400)
- Add color via Tailwind token class: `text-content-neutral-primary`, `text-content-neutral-secondary`, `text-content-accent-primary`

```html
<!-- ❌ Wrong — custom SCSS for what v2.0 typography already handles -->
<h4 class="section-title">Billing Cycle</h4>
<!-- .section-title { font-size: 2.4rem; font-weight: 700; color: var(--content-neutral-primary); } -->

<!-- ✅ Correct — v2.0 class + Tailwind color token + m-0 to reset browser defaults -->
<h4 class="heading-sm-semi-bold text-content-neutral-primary m-0">Billing Cycle</h4>
```

**SCSS file should only contain:**
1. Background/border/color rules that reference CSS token variables (`var(--border-neutral-primary)`)
2. Hover/active/focus pseudo-class state selectors
3. `border-inline-end` / `border-block-end` logical border properties (RTL-safe, no Tailwind equivalent)
4. `object-position` with logical values (`object-position: inline-start`)
5. Fixed pixel widths absent from the Tailwind spacing config (e.g. `width: 18.2rem` for a 182px table column)

**Text**
- All visible text must go through `i18n` — use `translate` pipe
- Add keys to `apps/apa/src/assets/i18n/en.json` via the `copy-update` skill

**Text**
- All visible text must go through `i18n` — use `translate` pipe
- Add keys to `apps/apa/src/assets/i18n/en.json` via the `copy-update` skill

### Step 5 — Wire interactions

- User events → Angular outputs or signals
- Data → `input()` signals, not `@Input()` decorators
- Loading/error states → `resource()` or `linkedSignal()`
- Track user actions → `ateraTrackableId` directive (see `trackable-events` skill)
- Role/plan gating → `ateraRoleGuard` / `ateraPlansGuard` (see `permissions` skill)

## Example: Danger Banner from Figma

Figma output shows:
```jsx
<div className="bg-[var(--fill\/danger\/subtle,#ffd5d2)] flex gap-[16px] items-center rounded-[6px]">
  <span className="text-[color:var(--fill\/danger\/bold,#c9372c)]">Something went wrong</span>
  <button>Dismiss</button>
</div>
```

**Check first:** does Atera already have `<atera-banner>`? Yes — use it.

```html
<atera-banner variant="error" [dismissible]="true" (dismiss)="onDismiss()">
  <span>{{ 'errors.something_went_wrong' | translate }}</span>
</atera-banner>
```

Only fall back to a custom div if no DS component exists for the pattern.

## Checklist Before Finishing

- [ ] Unconnected Figma nodes were audited in Step 1.5 and developer confirmed all mappings before code was written
- [ ] All DS components used (no custom reimplementations of existing components)
- [ ] No hardcoded hex colors — all via `var(--token)`
- [ ] All text uses `translate` pipe with keys in `en.json`
- [ ] `ChangeDetectionStrategy.OnPush` set
- [ ] Standalone component (no NgModule)
- [ ] **Layout uses Tailwind directly on elements** — no CSS classes that only set `display`/`flex`/`gap`/`padding`
- [ ] **Typography uses v2.0 classes** (`heading-sm-semi-bold`, `body-md-regular`, etc.) — no custom font-size/weight SCSS
- [ ] Spacing uses Tailwind (values in config) or arbitrary `[Xpx]` syntax (values not in config)
- [ ] Logical CSS properties for RTL (`margin-inline-start` not `margin-left`)

## References

- Design system components: `atera-ui-components` skill + `atera-ui-mcp`
- Token mapping: `css-styling` skill → "Figma Token Mapping" section
- Angular code generation: **`angular-dev-v21` skill** (primary reference for all Angular patterns)
- Translations: `copy-update` skill
- Page scaffolding: `apa-page-creation` skill
