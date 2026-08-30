# Primitives — React (React Aria + Radix Primitives)

> Research order and rationale live in `primitives.md` (agnostic). This file is the React-specific selection tables and libraries.

Before writing any interaction logic from scratch, check if React Aria or Radix Primitives already solves it. They handle keyboard management, focus trapping, and ARIA wiring correctly and accessibly.

## Library Priority

1. **React Aria (`react-aria` / `react-aria-components`)** — hook-based, headless, most granular control. Prefer for anything with complex keyboard/focus contracts.
2. **Radix Primitives (`@radix-ui/react-*`)** — component-based, headless, one package per primitive. Prefer when a compound-component shape fits better than hooks.
3. **Ark UI** — alternative headless set (Zag.js-based) if the codebase already standardizes on it — check codebase researcher output before introducing a third option.

Don't mix multiple primitive libraries for the same interaction pattern within one component — pick one per component and stay consistent with codebase precedent.

## Selection Table

| Component pattern | React Aria | Radix Primitives |
|---|---|---|
| Dropdown / select | `useSelect`, `useListBox` (`react-aria`) | `@radix-ui/react-select` |
| Combobox / autocomplete | `useComboBox` (`react-aria`) | — (compose Popover + custom list) |
| Context menu / menu bar | `useMenu`, `useMenuTrigger` (`react-aria`) | `@radix-ui/react-dropdown-menu`, `@radix-ui/react-context-menu` |
| Modal / dialog | `useDialog`, `useModalOverlay` (`react-aria`) | `@radix-ui/react-dialog` |
| Tooltip / popover | `useTooltip`, `useOverlayPosition` (`react-aria`) | `@radix-ui/react-tooltip`, `@radix-ui/react-popover` |
| Accordion / expansion | — | `@radix-ui/react-accordion` |
| Tabs | `useTabList` (`react-aria`) | `@radix-ui/react-tabs` |
| Toggle / switch | `useToggleButton`, `useSwitch` (`react-aria`) | `@radix-ui/react-switch`, `@radix-ui/react-toggle` |
| Slider | `useSlider` (`react-aria`) | `@radix-ui/react-slider` |
| Radio group | `useRadioGroup` (`react-aria`) | `@radix-ui/react-radio-group` |
| Checkbox | `useCheckbox` (`react-aria`) | `@radix-ui/react-checkbox` |
| Toast | `useToast` (`react-aria`) | `@radix-ui/react-toast` |
| Focus trap | `FocusScope` (`react-aria`) | `@radix-ui/react-focus-scope` (or Dialog's built-in trap) |
| Focus management in a list/grid | `useFocusManager` (`react-aria`) | — |
| Roving tabindex | `useFocusRing` + manual roving (`react-aria`) | — |
| Visually hidden | `VisuallyHidden` (`react-aria`) | `@radix-ui/react-visually-hidden` |
| Portal | `Overlay` (`react-aria`) | `@radix-ui/react-portal` |

```tsx
import { useButton } from 'react-aria';
import * as Dialog from '@radix-ui/react-dialog';
```

React Aria/Radix provide behaviour only — the DS owns the visual styling (Radix and React Aria both render unstyled by default).

## Reference Components as Inspiration

MUI, Chakra UI, and Ark UI-based libraries are built on similar accessibility patterns. Use them to understand *what* to build and *which primitive/hook to use* — **never copy their code directly**.

These libraries often carry legacy patterns of their own version. Always adapt:

| Reference pattern | Atera equivalent |
|---|---|
| Class component + lifecycle methods | Function component + hooks |
| Prop-drilled callback refs | `forwardRef` + `useImperativeHandle` only when truly needed |
| CSS-in-JS runtime styling | Static CSS/SCSS + custom-property override API |
| Global theme context override | Scoped CSS custom properties |
| Inline style props for variants | Typed variant prop mapped to class names |

## Truly No Primitive Available?

If neither React Aria nor Radix fits:
1. Check the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) for the interaction pattern
2. Implement keyboard handling via a custom hook (`use{Prefix}KeyboardNav`), never inline `onKeyDown` sprawl across the component
3. Document in a comment why no primitive was used
