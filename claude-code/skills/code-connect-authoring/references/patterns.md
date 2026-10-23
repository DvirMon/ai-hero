# Figma Code Connect — Patterns & Pitfalls

## Table of Contents
1. [Basic structure](#basic-structure)
2. [Property mapping functions](#property-mapping-functions)
3. [Variant filtering](#variant-filtering)
4. [Nested props](#nested-props)
5. [Instance swap](#instance-swap)
6. [Icon key mapping](#icon-key-mapping)
7. [Attribute-selector components](#attribute-selector-components)
8. [Content projection / slots](#content-projection--slots)
9. [Known errors and fixes](#known-errors-and-fixes)

---

## Basic structure

```typescript
import figma, { html } from '@figma/code-connect';

figma.connect(
  'https://www.figma.com/design/{FILE_KEY}/...?node-id=1234-5678',
  {
    props: {
      size: figma.enum('↕️ Size', { Lg: 'large', Md: 'normal', Sm: 'small' }),
      disabled: figma.enum('🚦 State', { Default: false, Disabled: true }),
    },
    example: ({ size, disabled }) => html`
      <atera-button [size]="'${size}'" [disabled]="${disabled}">Label</atera-button>
    `,
  },
);
```

**CRITICAL:** The URL must be an **inline string literal** in every `figma.connect()` call.  
Using a variable (`const URL = '...'; figma.connect(URL, ...)`) causes a `ParserError`.

---

## Property mapping functions

| Figma prop type | Code Connect function | Example |
|---|---|---|
| VARIANT | `figma.enum('Prop Name', { FigmaVal: 'angularVal' })` | `figma.enum('↕️ Size', { Lg: 'large', Md: 'normal' })` |
| BOOLEAN | `figma.boolean('Prop Name')` | `figma.boolean('Disabled')` → true/false |
| TEXT | `figma.string('Prop Name')` | `figma.string('Label Text')` |
| INSTANCE_SWAP | `figma.instance('Prop Name')` | `figma.instance('🔄 L icon swap')` |

**Emoji in property names are valid** — use the exact string from the Figma API (e.g. `'↕️ Size'`, `'🎨 Color'`).

**Boolean as disabled:** `figma.enum('🚦 State', { Default: false, Disabled: true })` — not `figma.boolean()`, because the Figma property is a VARIANT, not a BOOLEAN type.

---

## Variant filtering

Multiple connections on the same URL, each showing different code for a Figma variant:

```typescript
// Without icons
figma.connect(URL, {
  variant: { 'icon only': 'no' },
  props: { ... },
  example: ({ size }) => html`<button atera-button [size]="'${size}'">Label</button>`,
});

// Icon-only
figma.connect(URL, {
  variant: { 'icon only': 'yes' },
  props: { icon: figma.instance('🔄 L icon swap'), ... },
  example: ({ icon }) => html`<button atera-button>${icon}</button>`,
});
```

**Specificity rule:** Figma picks the connection whose variant filter has the most matching properties. To avoid ambiguity, filter on ALL properties that affect the generated code. If `State=Error` + `Horizontal=yes` produces different code than `State=Error` + `Horizontal=no`, create separate connections for both.

---

## Nested props

Access properties on a named child instance layer:

```typescript
figma.connect(URL, {
  variant: { '🎨 Color': '⚪️ Neutral' },
  props: {
    chip: figma.nestedProps('chip-neutral', {
      appearance: figma.enum('⬛️ Type', { Primary: 'primary', Secondry: 'secondary' }),
      size: figma.enum('↕️ Size', { Xs: 'tiny', Sm: 'small' }),
      disabled: figma.enum('🚦 State', { Default: false, Disabled: true }),
    }),
  },
  example: ({ chip }) => html`
    <atera-chip [appearance]="'${chip.appearance}'" [size]="'${chip.size}'" [disabled]="${chip.disabled}">
      Chip
    </atera-chip>
  `,
});
```

**CRITICAL:** Do NOT spread `figma.nestedProps()`:
```typescript
// ❌ CRASHES with InternalError
props: { ...figma.nestedProps('layer', { ... }) }

// ✅ CORRECT — assign to a named property
props: { chip: figma.nestedProps('layer', { ... }) }
```

The layer name must match the exact Figma layer name (case-sensitive). Find it by inspecting children at depth 3-4 via the REST API.

---

## Instance swap

Maps an INSTANCE_SWAP Figma property to render the nested component's own Code Connect snippet:

```typescript
props: {
  leftIcon: figma.instance('🔄 L icon swap'),
  rightIcon: figma.instance('🔄 R icon swap'),
},
example: ({ leftIcon, rightIcon }) => html`
  <button atera-button>
    ${leftIcon}   <!-- renders as: <atera-icon-2 before key="uii_plus_bold"> -->
    Label
    ${rightIcon}
  </button>
`,
```

The rendered output uses the nested component's Code Connect template, so `atera-icon-2` must also have its Code Connect published for icons to resolve correctly.

---

## Icon key mapping

Icon key format: `uii_{snake_case_name}_{weight}`  
Weight suffixes: `bold`, `fill`, `light`, `regular`, `thin`, `duotone`

Example: Figma component "Plus" + Weight="Bold" → key `uii_plus_bold`

```typescript
figma.connect(ICON_URL, {
  props: {
    iconKey: figma.enum('Weight', {
      Bold: 'uii_plus_bold',
      Fill: 'uii_plus_fill',
      Light: 'uii_plus_light',
      Regular: 'uii_plus_regular',
    }),
  },
  example: ({ iconKey }) => html`<atera-icon-2 key="${iconKey}" size="md" />`,
});
```

For bulk icon generation, use `tools/scripts/generate-icon-code-connect.py` which auto-generates all 1532+ icon connections by cross-referencing SVG files in `libs/shared/assets/2.0/svg/uii/`.

---

## Attribute-selector components

Some Angular components use attribute selectors (e.g. `input[atera-input]`, `button[atera-button]`). Show them as attributes on native elements:

```typescript
// atera-button: selector = 'button[atera-button]'
example: ({ size, appearance }) => html`
  <button atera-button [size]="'${size}'" [appearance]="'${appearance}'">Label</button>
`,

// atera-input: selector = 'input[atera-input]'
example: ({ size }) => html`
  <input atera-input [size]="'${size}'" placeholder="Enter text" />
`,
```

---

## Content projection / slots

Angular uses attribute-based content projection. Show the correct slot attributes:

```typescript
// atera-form-field slots
example: ({ size, appearance }) => html`
  <atera-form-field>
    <atera-form-field-label>Label</atera-form-field-label>
    <span ateraTextPrefix>https://</span>
    <input atera-input [size]="'${size}'" [appearance]="'${appearance}'" placeholder="text" />
    <span ateraTextSuffix>.com</span>
    <atera-form-field-hint>Hint text</atera-form-field-hint>
    <atera-form-field-error>Error message</atera-form-field-error>
  </atera-form-field>
`,

// atera-split-button named slots
example: ({ ... }) => html`
  <atera-split-button>
    <button atera-button main-action>Action</button>
    <button atera-button split-action>
      <atera-icon-2 key="uii_caret_down_bold" size="sm" />
    </button>
  </atera-split-button>
`,

// atera-badge positioning wrapper
example: () => html`
  <div style="position: relative;">
    <!-- host element -->
    <atera-badge top="0" right="0">
      <atera-counter [value]="9" size="sm" />
    </atera-badge>
  </div>
`,
```

---

## Molecules & organisms — nested instance properties

Molecules and organisms in Figma contain child INSTANCE layers whose properties live on the nested component, not on the parent component set. `figma.nestedProps` is the only way to read them.

### Finding nested layer names

Fetch the parent component at depth 3–5 to see its child instances:

```bash
source ~/.zshrc && curl -s \
  "https://api.figma.com/v1/files/{FILE_KEY}/nodes?ids=NODE_ID&depth=4" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" | python3 -c "
import json, sys
root = json.load(sys.stdin)['nodes']['NODE_ID']['document']

def walk(node, depth=0):
    t = node.get('type','')
    n = node.get('name','')
    if t in ('INSTANCE','COMPONENT'):
        props = list(node.get('componentProperties', {}).keys())
        print('  ' * depth + f'[{t}] {repr(n)}  props={props}')
    for c in node.get('children', []):
        walk(c, depth+1)

walk(root)
"
```

This prints every INSTANCE layer name and the component-property keys it exposes. The layer name is what you pass to `figma.nestedProps()`.

**CRITICAL:** Layer names are case-sensitive and must be exact. Figma sometimes has typos (e.g. `'Intials'` instead of `'Initials'`). Copy the name from the API output — do not guess.

### Stripping the `#nodeId` suffix

The REST API returns property keys with a `#nodeId` suffix, e.g. `'Color#1560:35'`. Code Connect requires the bare name without the suffix:

```typescript
// ❌ WRONG — taken verbatim from the API
color: figma.enum('Color#1560:35', { ... })

// ✅ CORRECT — strip everything from '#' onward
color: figma.enum('Color', { ... })
```

Strip the suffix from **both nested-instance property names and top-level property names** whenever it appears.

### Getting exact variant-option casing for nested components

`figma.enum()` keys must match the Figma variant values exactly — including capitalisation. The parent component's depth-1 response only lists property names, not the full variant options for child instances. You must fetch the nested component's own COMPONENT_SET:

```bash
# Step 1 — find the nested component's node ID from the depth-4 walk above.
# The INSTANCE will have a "componentId" field pointing to the COMPONENT.
# From there, look up the parent COMPONENT_SET.

# Step 2 — fetch the COMPONENT_SET at depth=1 to get variantOptions
source ~/.zshrc && curl -s \
  "https://api.figma.com/v1/files/{FILE_KEY}/nodes?ids=COMPONENT_SET_NODE_ID&depth=1" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" | python3 -c "
import json, sys
doc = json.load(sys.stdin)['nodes']['COMPONENT_SET_NODE_ID']['document']
for k, v in doc.get('componentPropertyDefinitions', {}).items():
    print(repr(k), v.get('type'), v.get('variantOptions', []))
"
```

Tip: if the COMPONENT_SET is not in your cached `/components` list, scan adjacent node IDs. The COMPONENT_SET is typically the parent of a COMPONENT — decrement the node number by 1 (e.g. component `1560:74330` → try COMPONENT_SET `1560:74329` or `1560:74331`).

### Boolean polarity — always verify

Figma boolean variant names are not always intuitive. A property named `Image - Initials` with value `true` might mean "initials mode" (the initials layer is active), not "image mode". Always verify which template is actually shown by testing in Dev Mode:

1. Select a node in Figma where you can see what's rendered.
2. Note which `figma.connect()` variant filter Figma reports at the bottom of Dev Mode.
3. If the filter is wrong, swap `true`/`false` in your variant conditions.

### Shared nested props — extract to const, then spread

When multiple connections all read the same nested layer, extract `figma.nestedProps` to a const and spread it:

```typescript
// ✅ Extract to a named const
const badgeProps = {
  badge: figma.nestedProps('Badge', {
    size: figma.enum('Size', { sm: 'sm', md: 'md' }),
  }),
};

// Then spread into each connection that needs it
figma.connect(URL, {
  variant: { 'Image - Initials': true, Badge: true },
  props: { ...sharedProps, ...initialsLayerProps, ...badgeProps },
  example: ({ size, shape, initials, badge }) => html`...`,
});
```

**CRITICAL:** Never spread `figma.nestedProps()` inline. Assign it to a named key first:

```typescript
// ❌ CRASHES with InternalError
props: { ...figma.nestedProps('Badge', { ... }) }

// ✅ CORRECT — nested under a key, then the outer object can be spread
const badgeProps = { badge: figma.nestedProps('Badge', { ... }) };
props: { ...badgeProps }  // ← spreading the wrapper object is fine
```

### Variant filtering limitation for nested properties

`variant: { ... }` only works on the TOP-LEVEL `componentPropertyDefinitions` of the component set. You cannot filter on a nested instance's property. If two Figma states differ only in a nested property (e.g. `Badge.Element = "Counter"` vs `"Status indicator"`), Figma will show both connections at equal specificity — it will pick one arbitrarily.

**Solution:** ask the design team to promote the discriminating property to a top-level variant on the parent component set.

### Dev Mode re-evaluation limitation

When a user changes a **nested** property in Figma (e.g. toggling Color on a child instance), Figma Dev Mode does **not** re-evaluate the Code Connect snippet — only a top-level variant change triggers a re-render.

This is a Figma limitation, not a Code Connect bug. The MCP integration reads all properties via the REST API snapshot so it always shows the correct output.

Communicating this to designers: "Color will update in the MCP preview (figma-to-code) correctly. In Dev Mode, toggle any top-level property (e.g. Size or Border) to force a refresh."

---

## Known errors and fixes

### ParserError: URL must be a string literal
```typescript
// ❌
const URL = 'https://...';
figma.connect(URL, { ... });

// ✅ — inline in every figma.connect() call
figma.connect('https://...', { ... });
```

### ParserError: No conditional expressions in templates
```typescript
// ❌
example: ({ showIcon }) => html`<button>${showIcon ? html`<atera-icon-2 />` : ''}</button>`

// ✅ — use separate figma.connect() with variant filter
figma.connect(URL, { variant: { hasIcon: 'yes' }, ... });
figma.connect(URL, { variant: { hasIcon: 'no' }, ... });
```

### InternalError: Cannot read properties of undefined (reading 'initializer')
Caused by spreading `figma.nestedProps()`. See [Nested props](#nested-props).

### 403 from Figma API
Token expired. Generate a new token at figma.com → Settings → Personal access tokens, then update `~/.zshrc`:
```bash
export FIGMA_ACCESS_TOKEN=figd_...
```

### Wrong Figma node (FRAME instead of COMPONENT_SET)
The URL's `node-id` might point to a frame containing the component, not the component itself.
Use the REST API to inspect node type:
```bash
curl -s ".../nodes?ids=NODE_ID&depth=2" ... | python3 -c "
import json,sys; d=json.load(sys.stdin)
for nid, nd in d['nodes'].items():
    doc = nd['document']
    print(doc['type'], doc['name'])
    for c in doc.get('children', [])[:5]:
        print(' ', c['id'], c['type'], c['name'])
"
```
Use the COMPONENT_SET node ID (not FRAME, CANVAS, or PAGE).

### MCP preview shows incomplete code
The "MCP preview" in Figma is Figma's own AI code generator — it's separate from Code Connect. Our Code Connect snippets appear in the **"Code" tab** in Dev Mode. For the MCP preview to improve, ensure variant coverage is complete so no connection goes unmatched.
