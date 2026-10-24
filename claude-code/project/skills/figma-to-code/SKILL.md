---
name: figma-to-code
description: Entry point for all Figma-to-code tasks. Routes to the correct specialized skill based on the scenario — product feature implementation, design system component creation, or token/styling reference.
---

# Figma to Code — Orchestrator

When given a Figma URL or asked to implement a design, first identify which scenario applies, then invoke the matching skill.

## Scenario Routing

### 1. Implementing a product feature
**Signs:** A screen, page, flow, or UI section from the product (APA or portal). Uses existing design system components. Lives in `apps/` or a feature library.

→ Use the **`figma-feature-implementation`** skill.

### 2. Building a new design system component
**Signs:** The request is to create or add a new component to the design system library (`libs/shared/ui-core`). The component will be reused across the product.

→ Use the **`figma-ds-component`** skill.

### 3. Token/styling question only
**Signs:** User asks which CSS variable to use for a color, border, or fill seen in Figma metadata. No component or feature to build.

→ See the **Figma Token Mapping** section in the `css-styling` skill.

## When in Doubt

If the Figma node contains both product UI and new design system components, split the work:
- Build the DS component first (`figma-ds-component`)
- Then implement the feature using it (`figma-feature-implementation`)
