---
name: figma-code-connect
description: Generate Figma Code Connect files (.figma.ts) for Atera Angular design system components. Use when asked to connect a Figma component to Angular code, create/update a .figma.ts file, map Figma properties to Angular inputs, or set up Code Connect for a new v2.0 component. Covers property mapping (enum, boolean, instance, nestedProps), variant filtering, validation, and publishing.
---

# Figma Code Connect

Links Figma components to Angular code snippets shown in Figma Dev Mode and the MCP preview.

## Setup

- Config: `figma.config.json` at repo root (parser: html, includes all `**/*.figma.ts`)
- Scripts: `npm run figma:validate` · `npm run figma:publish` · `npm run figma:unpublish`
- Token: `FIGMA_ACCESS_TOKEN` in `~/.zshrc` — prefix all shell commands with `source ~/.zshrc &&`
- Output file: `<component-dir>/<component-name>.figma.ts`

## Workflow

### 1. Read the Angular component

Understand the selector, inputs, and usage pattern before touching Figma.

### 2. Find the Figma node ID

```bash
# Search components list (cached or freshly fetched)
source ~/.zshrc && curl -s "https://api.figma.com/v1/files/Vf0AgkW071TIvOTUpRuIaV/components" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" -o /tmp/figma_components.json

python3 -c "
import json
data = json.load(open('/tmp/figma_components.json'))
comps = data['meta']['components']
seen = set()
for c in comps:
    cs = c.get('containing_frame', {}).get('containingComponentSet', {})
    if 'COMPONENT_NAME' in cs.get('name', ''):
        nid = cs.get('nodeId', '')
        if nid not in seen:
            seen.add(nid)
            print(nid, '|', cs['name'])
"
```

### 3. Fetch Figma component properties

**Atoms** — fetch at depth=1 to read top-level `componentPropertyDefinitions`:

```bash
source ~/.zshrc && curl -s \
  "https://api.figma.com/v1/files/Vf0AgkW071TIvOTUpRuIaV/nodes?ids=NODE_ID&depth=1" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" | python3 -c "
import json, sys
doc = json.load(sys.stdin)['nodes']['NODE_ID']['document']
for k, v in doc.get('componentPropertyDefinitions', {}).items():
    print(repr(k), v.get('type'), v.get('variantOptions', []))
"
```

**Molecules & organisms** — fetch at depth=4 to find nested INSTANCE layer names and their exposed props, then fetch each nested COMPONENT_SET at depth=1 for exact variant option casing:

```bash
# Step A — find nested instance layer names
source ~/.zshrc && curl -s \
  "https://api.figma.com/v1/files/Vf0AgkW071TIvOTUpRuIaV/nodes?ids=NODE_ID&depth=4" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" | python3 -c "
import json, sys
root = json.load(sys.stdin)['nodes']['NODE_ID']['document']

def walk(node, depth=0):
    t = node.get('type','')
    n = node.get('name','')
    cid = node.get('componentId','')
    if t in ('INSTANCE','COMPONENT'):
        props = list(node.get('componentProperties', {}).keys())
        print('  ' * depth + f'[{t}] {repr(n)}  componentId={cid}  props={props}')
    for c in node.get('children', []):
        walk(c, depth+1)

walk(root)
"

# Step B — for each nested instance, fetch its COMPONENT_SET for exact variantOptions
# (COMPONENT_SET is usually the parent of the componentId; try nodeId ± 1)
source ~/.zshrc && curl -s \
  "https://api.figma.com/v1/files/Vf0AgkW071TIvOTUpRuIaV/nodes?ids=NESTED_COMPONENT_SET_ID&depth=1" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" | python3 -c "
import json, sys
doc = json.load(sys.stdin)['nodes']['NESTED_COMPONENT_SET_ID']['document']
for k, v in doc.get('componentPropertyDefinitions', {}).items():
    print(repr(k), v.get('type'), v.get('variantOptions', []))
"
```

**Strip `#nodeId` suffixes** from all property names before using them in `figma.enum()` / `figma.boolean()` / `figma.string()`. See [patterns.md](references/patterns.md) → *Molecules & organisms* for full guidance including Boolean polarity verification and Dev Mode limitations.

### 4. Write the .figma.ts file

See [patterns.md](references/patterns.md) for all mapping patterns and known pitfalls.

**Always use the Figma file URL:**
`https://www.figma.com/design/Vf0AgkW071TIvOTUpRuIaV/%F0%9F%92%A0-Components-2.0?node-id=NODE-ID`

Replace `:` in node IDs with `-` (e.g. `6015:2109` → `node-id=6015-2109`).

### 5. Validate

```bash
source ~/.zshrc && npm run figma:validate 2>&1 | python3 -c "
import sys, json
out = sys.stdin.read()
start = out.find('[')
data = json.loads(out[start:])
target = [d for d in data if 'NODE-ID' in d.get('figmaNode','')]
print(f'{len(target)} connections parsed')
for d in target: print(' ', d.get('variant'))
"
```

Fix any `ParserError` or `InternalError` before publishing. See [patterns.md](references/patterns.md) → *Known errors and fixes*.

### 6. Publish & commit

```bash
source ~/.zshrc && npm run figma:publish
git add <file>.figma.ts
git commit -m "feat: add Figma Code Connect for <component>"
git push origin feat/figma-code-connect
```

## Variant Strategy

When a component has multiple relevant states that generate different code, create one `figma.connect()` per meaningful combination. Always filter on **all properties** that affect the generated code output — partial matches cause wrong connections to be picked.

**Rule:** If two variant values produce the same Angular code, they can share a connection or be left uncovered (Figma will fall back gracefully). Only add connections where the code actually differs.

**Example — input component:** `State × Horizontal` both affect output → use all 8+ combinations.
**Example — button:** `icon only` changes template structure → use separate `variant: { 'icon only': 'yes' }` connection.

## File Placement

```
libs/shared/ui-core/src/lib/components/2.0/
  atera-button/
    atera-button.figma.ts        ← here for top-level components
  atera-chip/
    components/atera-chip/
      atera-chip.figma.ts        ← follow component's own folder depth
```
