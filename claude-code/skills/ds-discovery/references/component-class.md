# Component Class — DS Conventions (Framework-Agnostic)

> Framework-specific syntax lives in the sibling file for your target framework (e.g. `component-class.angular.md`). This file covers the conventions that hold regardless of framework — read it first, then the framework file for concrete syntax.

> Replace `{prefix}` with component prefix (e.g., `atera`, `my`, `app`). Replace `<Name>` with component name (e.g., `Card`, `Stepper`).

## Required Structure

Every DS component defines:
- Typed variant/size/color unions (e.g. `<Name>Variant = 'primary' | 'secondary'`)
- A root element tag/selector following the DS naming convention (`{prefix}-<name>`)
- A theme marker class on the root element — activates CSS role tokens. Without it, custom properties like `--fill-brand-bold` won't resolve.
- Variant/state classes applied to the **root element**, never to an inner wrapper — this keeps the root as the single styling anchor, no wrapper elements needed for styling purposes.
- A disabled prop reflected as both a state class and an ARIA attribute (`aria-disabled`) on the root.

## DS-Specific Rules

### Theme element class is required

Always apply the theme class to the root element. It activates CSS role tokens; without it, `var(--fill-brand-bold)` and similar tokens will not resolve.

### Variant classes belong on the root, not nested markup

```
// GOOD: declared at the root binding layer
root: {
  'class.primary': variant === 'primary',
  'class.danger': variant === 'danger',
}
```

```
<!-- BAD: class binding pushed into inner template -->
<div class="primary">
```

### Types are defined alongside the component

Define all public types in the component's own file, then re-export them from the public entry point (`public-api.ts` / `index.ts`). Never define a type only at the re-export layer.