# Primitives — React catalog

> Discovery order lives in `primitives.md`. This file is a **catalog** of well-known React
> libraries. Which ones apply, and in what order, is `sources.primitives` /
> `sources.references` in the design-system config — consult only those.

| Catalog id | Kind | Notes |
|---|---|---|
| `react-aria` | primitives | hook-based, headless, most granular keyboard/focus control |
| `@radix-ui` | primitives | component-based, headless, one package per primitive |
| `ark-ui` | primitives | Zag.js-based headless set |
| `mui` · `radix-themes` · `chakra-ui` | reference | inspiration only |

Don't mix primitive libraries for the same interaction pattern within one component — pick one
and stay consistent with codebase precedent.

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

These libraries often carry legacy patterns of their own version. Adapt to the idioms in `{conventions}`; the defaults:

| Reference pattern | Current idiom |
|---|---|
| Class component + lifecycle methods | Function component + hooks |
| Prop-drilled callback refs | `forwardRef` + `useImperativeHandle` only when truly needed |
| CSS-in-JS runtime styling | Static CSS/SCSS + custom-property override API |
| Global theme context override | Scoped CSS custom properties |
| Inline style props for variants | Typed variant prop mapped to class names |

## Truly No Primitive Available?

If no library in `sources.primitives` fits:
1. Check the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) for the interaction pattern
2. Implement keyboard handling via a custom hook (`use{Prefix}KeyboardNav`), never inline `onKeyDown` sprawl across the component
3. Document in a comment why no primitive was used
