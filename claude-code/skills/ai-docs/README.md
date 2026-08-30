# AI-Friendly Documentation Skill

Generates token-efficient JSDoc + Markdown documentation for AI agent consumption.

## Problem

Documentation written for humans often bloats AI agent context:
- HTML wrapping adds tokens without signal
- Verbose narratives repeat what code shows
- JSDoc and Markdown docs contradict each other
- Docs scatter across central folders, hard for agents to find

## Solution

This skill generates three colocated, complementary docs:

1. **JSDoc** (on component) — Terse. One-line purpose + non-obvious constraints. IDE-readable.
2. **spec.md** — Comprehensive, self-contained spec. Acceptance criteria, test scenarios, edge cases. No narrative fluff.
3. **narrative.md** — Design intent, relationships, scope boundary. *Why* this domain exists.

**Benefit:** Agents can find all context in one folder. No redundancy. Markdown = 90% fewer tokens than HTML. Self-contained sections = agents read only what's relevant.

## Research basis

- [Fern: Write LLM-friendly docs (2025)](https://buildwithfern.com/post/how-to-write-llm-friendly-documentation) — Markdown beats HTML; self-contained sections; explicit over implicit
- [Why JSDoc Matters in 2025](https://medium.com/@genautkin/why-jsdoc-still-matters-in-2025-even-in-the-age-of-ai-ec9c9fa5d43a) — JSDoc helps LLMs make better suggestions; link to full docs
- [Colocation best practice](https://kentcdodds.com/blog/colocation) — Docs near code stay in sync

## When to use

- Scaffolding new components (generate docs from scratch)
- Refining existing documentation (make it agent-friendly)
- Before implementing or reviewing code (context should be ready for LLM review)

## Usage

### Manual (guided)
```bash
/ai-docs [component-path]
```

User provides component path. Skill:
1. Audits existing JSDoc + .md docs
2. Identifies token waste, redundancy, unclear scope
3. Generates refined JSDoc + spec.md + narrative.md
4. Colocates in `docs/` folder

### As reference
- `SKILL.md` — Full instructions and philosophy
- `references/spec.md.template` — Spec.md structure and examples
- `references/narrative.md.template` — Narrative.md structure and examples

## Output format

### spec.md (Markdown)
Self-contained sections: Overview, API, Behavior, Accessibility, Acceptance Criteria, Testing Strategy. No narrative fluff. Lists + short sentences.

### narrative.md (Markdown)
Design intent: Purpose, Design Role, Design Decisions, Accessibility & i18n, Scope & Constraints, Related Components.

### JSDoc (on component)
```typescript
/**
 * One line: tag + purpose. [Optional scope marker or constraint.]
 */
```

## Token efficiency

- **Markdown, not HTML:** 90% fewer tokens than HTML-wrapped docs
- **Self-contained sections:** Agents retrieve only sections they need
- **No redundancy:** JSDoc ≠ spec.md; each serves a distinct purpose
- **Terse language:** Lists + short sentences, no prose paragraphs
- **Explicit over implicit:** No vague references; state exact values

## See also

- [CLAUDE.md](../../CLAUDE.md) — Global docs-by-responsibility pattern
- [Project CLAUDE.md](../../../git/org/CLAUDE.md) — Project-specific doc rules
- [Colocation](https://kentcdodds.com/blog/colocation) — Why docs should live with code
