---
name: ai-docs
description: Generate/refine JSDoc + Markdown documentation for AI agent consumption following token-efficient best practices
---

# AI-Friendly Documentation Skill

Generates terse JSDoc + comprehensive Markdown docs (spec.md, narrative.md) colocated with code, optimized for LLM context efficiency and agent discoverability.

## Research basis

- [Fern: Write LLM-friendly docs](https://buildwithfern.com/post/how-to-write-llm-friendly-documentation) — Markdown 90% more token-efficient than HTML; self-contained sections; explicit over implicit
- [Why JSDoc Matters in 2025](https://medium.com/@genautkin/why-jsdoc-still-matters-in-2025-even-in-the-age-of-ai-ec9c9fa5d43a) — JSDoc helps LLMs make better code suggestions; terse + links to full docs
- [Colocation best practice](https://kentcdodds.com/blog/colocation) — docs near code stay in sync and improve discoverability

## On start

Ask user: **component/domain path** (e.g., `apps/issa-landing/src/design-system/components/Button/`).

Read:
- Component source file (`.tsx`, `.ts`, etc.)
- Existing JSDoc on component + props interface
- Existing `docs/spec.md` (if present)
- Existing `docs/narrative.md` (if present)
- Project `CLAUDE.md` (search up to repo root)

## Analysis phase

1. **Current state audit:**
   - JSDoc length (target: <50 words on component function)
   - JSDoc redundancy with TypeScript (is it just repeating what types say?)
   - Markdown docs: are sections self-contained? Can an agent read one section without needing others?
   - Token waste: any verbose narrative, repeated concepts, or structural description that's visible in code?

2. **Identify gaps:**
   - Is scope/reusability boundary marked? (e.g., "feature-local, not design-system")
   - Is non-obvious behavior documented? (responsive breakpoints, async flows, edge cases)
   - Does spec.md have clear acceptance criteria and test scenarios?
   - Does narrative.md explain *why* this domain exists, not just *what* it does?

## Generation phase

### 1. JSDoc (component function)

**Target:** One line + @example if non-obvious.

Format:
```typescript
/**
 * Rendered tag + purpose. [Link to spec.md if needed.]
 * 
 * @example
 * <Component prop="value">Content</Component>
 */
export function Component(props: Props) { ... }
```

**Rules:**
- Don't describe layout/composition visible in code (no "renders three child components in a grid")
- DO mark non-obvious constraints (responsive behavior, scope boundary, ADR reference)
- DO include @example only if:
  - Props are ambiguous (not clear from TypeScript signature)
  - Common pitfalls exist (conditional prop meaning, complex state)
  - Usage is non-standard for the framework
- Skip @example if: TypeScript + readable class names + IDE hover already clarify usage

### 2. Props interface JSDoc

Format:
```typescript
interface Props {
  /** Purpose of this prop. Constraints (e.g., "only meaningful when x='y'"). */
  propName: type;
}
```

**Rules:**
- One line per prop (or 2 if constraint is complex)
- State type constraints (e.g., `disabled` only on Button, not Link)
- State defaults if non-obvious
- Link to spec.md for behavioral details only if critical to correct usage

### 3. `docs/spec.md` (Markdown)

**Purpose:** Acceptance criteria, test scenarios, edge cases — queryable by agents.

**Structure:**
```markdown
# [Component name] Spec

## Overview
One sentence: rendered tag + purpose.

## API

### Props
- `propA` (type): Purpose + constraints
- `propB` (type): Purpose + constraints

### Slots / Children
Describe content projection, if present.

## Behavior

### [Behavior 1: "Default state"]
- What happens when props are X
- Edge cases (empty, null, undefined)
- Responsive behavior if applicable
- Animation/motion if applicable

### [Behavior 2: "Interaction flow"]
Step-by-step scenario. Include timing if relevant.

## Accessibility

- Semantic HTML: rendered tag + role
- ARIA: attributes, live regions, announcements
- Keyboard: focusable? tabindex? arrow keys?
- Screen reader: what does it announce?

## Acceptance Criteria

- [ ] Renders correct HTML structure
- [ ] Accepts all documented props
- [ ] Handles edge cases (null, undefined, empty)
- [ ] Responsive below 600px (if applicable)
- [ ] Passes accessibility audit (WCAG 2.0 AA)

## Testing Strategy

### Unit tests
- Props validation
- Edge case handling
- Computed state/outputs

### Visual/Integration tests
- Render across viewport sizes
- Interaction flows
```

**Rules:**
- Each section self-contained (agent can read it in isolation)
- Use lists + short sentences (not paragraphs)
- Explicit over implicit (state exact values, not "similar to X")
- No redundancy with JSDoc (spec.md is comprehensive; JSDoc is prop-level)

### 4. `docs/narrative.md` (Markdown)

**Purpose:** Design intent, relationships, *why* this domain exists.

**Structure:**
```markdown
# [Component name] — Design Narrative

## Purpose
What problem does this solve? Who uses it?

## Design role
How does it fit in the larger system? Relationships to other domains.
- Part of [System]
- Sibling to [Component]
- Wraps [Primitive]

## Design decisions
Links to ADRs or decisions.md if this is a design-system component:
- Why this tag/behavior/API shape?
- Alternatives considered and rejected?

## Accessibility & i18n
- Semantic HTML baseline
- RTL-aware? i18n constraints?
- Motion sensitivity

## Scope & Constraints
- What this component does NOT do
- Responsibilities it delegates (e.g., "validation is the caller's job")
- Feature-local vs. design-system? (marks reusability boundary)
```

**Rules:**
- Explain *why*, not *what* (spec.md covers what)
- Links to decisions.md / ADRs for design rationale
- Mark scope clearly ("feature-local, not design-system" or "design-system, may be reused across apps")

## Output

Generate:
1. **JSDoc**: Refine component + props interface
2. **docs/spec.md**: Full spec following structure above
3. **docs/narrative.md**: Design intent + relationships
4. **Summary**: What changed, what's optimized for agent consumption

Verify:
- No HTML, only Markdown
- No redundancy between JSDoc and .md files
- Each .md section is self-contained (can be read in isolation)
- Headings clear and semantic (h1 = title, h2 = major sections, h3 = subsections)
- Code examples are copyable (no visual formatting, plain text)

## Invocation

Trigger manually when the user asks to generate or refine docs for a component/domain path, or run through the analysis + generation phases yourself: read the component, produce the outputs above, and report the refinements.

---

## Examples

### Before (verbose)
```typescript
/**
 * A two-column timeline entry — composes Eyebrow (marker), Body (meta and body text), and
 * Heading at level={3} (title) inside a 120px 1fr grid with a top hairline rule. Below
 * 600px the grid collapses to a single stacked column (marker/meta above title/body). Feature
 * component local to the Mission+Program section — not a design-system organism.
 *
 * @param props - ProgramItemProps (marker, meta, title, children)
 * @returns a grid row containing the marker/meta narrow column and title/body wide column
 *
 * @example
 * <ProgramItem marker="01" meta="2026-2027" title="Foundation">
 *   <p>Establishing sovereign launch capability.</p>
 * </ProgramItem>
 */
```

### After (terse)
```typescript
/**
 * Timeline entry (120px marker + 1fr body). Responsive: stacked below 600px.
 * Feature-local to Mission+Program section — not design-system.
 */
```

The full usage example and design context moved to `docs/spec.md` and `docs/narrative.md`.

---

## See also

- CLAUDE.md (project's own JSDoc/documentation rules)
- spec.md template
- narrative.md template
- decisions.md (domain-level design/impl choices)
