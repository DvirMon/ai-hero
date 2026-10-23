---
name: code-connect-authoring
description: Author, validate and publish Figma Code Connect files (.figma.ts) that map a project's design system components to Figma, using the project's .claude/figma-project.json for file key, selector prefix and scripts. Covers property mapping (enum, boolean, instance, nestedProps), variant filtering, validation and publishing. Not the Figma plugin's figma-code-connect skill.
---

# Code Connect authoring

Links DS components to the code snippets shown in Figma Dev Mode and returned by
`get_design_context` as `CodeConnectSnippet`.

## 0. Gate on the project config

Read `.claude/figma-project.json` ([project-config.md](../figma-to-code/references/project-config.md)).

- `codeConnect.available: false` → **stop.** Report `codeConnect.reason`; component mapping
  stays a spec-time decision via the [unmapped-node audit](../figma-to-code/references/unmapped-node-audit.md).
- `available: true` → use `codeConnect.figmaFileKey` (`{FILE_KEY}` below), `codeConnect.scripts`,
  `codeConnect.tokenEnv`, `codeConnect.placement` and `designSystem.selectorPrefix`. A missing
  one of these is a stop too — don't fall back to another project's values.

`.figma.ts` files live in the repo that owns the DS components (`designSystem.path` or the
package's own repo), not in a consuming app.

## 1. Read the component

Selector, inputs, content-projection slots, before touching Figma.

## 2. Find the Figma node ID

```bash
source ~/.zshrc && curl -s "https://api.figma.com/v1/files/{FILE_KEY}/components" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" -o /tmp/figma_components.json

python3 -c "
import json
comps = json.load(open('/tmp/figma_components.json'))['meta']['components']
seen = set()
for c in comps:
    cs = c.get('containing_frame', {}).get('containingComponentSet', {})
    if 'COMPONENT_NAME' in cs.get('name', '') and cs.get('nodeId') not in seen:
        seen.add(cs['nodeId']); print(cs['nodeId'], '|', cs['name'])
"
```

The node must be the COMPONENT_SET, not a FRAME around it — see
[patterns.md](references/patterns.md) → *Wrong Figma node*.

## 3. Fetch component properties

**Atoms** — depth=1, read `componentPropertyDefinitions`:

```bash
source ~/.zshrc && curl -s \
  "https://api.figma.com/v1/files/{FILE_KEY}/nodes?ids=NODE_ID&depth=1" \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" | python3 -c "
import json, sys
doc = json.load(sys.stdin)['nodes']['NODE_ID']['document']
for k, v in doc.get('componentPropertyDefinitions', {}).items():
    print(repr(k), v.get('type'), v.get('variantOptions', []))
"
```

**Molecules & organisms** — depth=4 to find nested INSTANCE layer names, then each nested
COMPONENT_SET at depth=1 for exact variant casing. Scripts and the boolean-polarity check:
[patterns.md](references/patterns.md) → *Molecules & organisms*.

Strip `#nodeId` suffixes from every property name before using it.

## 4. Write the `.figma.ts`

Patterns and pitfalls: [patterns.md](references/patterns.md). Its examples use the `atera-`
prefix; substitute `designSystem.selectorPrefix`. The URL must be an inline string literal in
every `figma.connect()`:
`https://www.figma.com/design/{FILE_KEY}/<file-name>?node-id=NODE-ID` (`:` → `-` in the ID).

## 5. Validate

```bash
source ~/.zshrc && <codeConnect.scripts.validate> 2>&1 | python3 -c "
import sys, json
out = sys.stdin.read(); data = json.loads(out[out.find('['):])
target = [d for d in data if 'NODE-ID' in d.get('figmaNode','')]
print(f'{len(target)} connections parsed')
for d in target: print(' ', d.get('variant'))
"
```

Fix every `ParserError` / `InternalError` before publishing.

## 6. Publish

`source ~/.zshrc && <codeConnect.scripts.publish>`, then commit the `.figma.ts` on a feature
branch with the repo's commit convention.

## Variant strategy

One `figma.connect()` per combination that produces **different code**; filter on every
property that affects the output — Figma picks the most specific match, and a partial filter
picks the wrong one. Values that produce identical code share a connection or stay uncovered.
