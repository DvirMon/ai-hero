# Primitives — Angular catalog

> Discovery order lives in `primitives.md`. This file is a **catalog** of well-known Angular
> libraries. Which ones apply, and in what order, is `sources.primitives` /
> `sources.references` in the design-system config — consult only those.

| Catalog id | Kind | Section |
|---|---|---|
| `@angular/cdk` | primitives | CDK Selection Table |
| `ng-primitives` | primitives | Angular Primitives |
| `angular-material` | reference | Angular Material as Inspiration |

## CDK Selection Table

| Component pattern | CDK to use |
|---|---|
| Dropdown / select / combobox | `@angular/cdk/listbox` or `@angular/cdk/overlay` |
| Context menu / menu bar | `@angular/cdk/menu` |
| Modal / dialog | `@angular/cdk/dialog` |
| Tooltip / popover (positioned overlay) | `@angular/cdk/overlay` + `@angular/cdk/portal` |
| Accordion / expansion | `@angular/cdk/accordion` |
| Drag and drop | `@angular/cdk/drag-drop` |
| Tree (hierarchical list) | `@angular/cdk/tree` |
| Data table | `@angular/cdk/table` |
| Virtual scroll | `@angular/cdk/scrolling` |
| Focus management in a list/grid | `FocusKeyManager` from `@angular/cdk/a11y` |
| Focus trap inside a panel | `FocusTrap` from `@angular/cdk/a11y` |
| Screen reader announcements | `LiveAnnouncer` from `@angular/cdk/a11y` |

```typescript
import { FocusKeyManager } from '@angular/cdk/a11y';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { Overlay } from '@angular/cdk/overlay';
```

CDK provides behaviour only — you own the visual styling.

## Angular Material as Inspiration

Angular Material is built on the same CDK and follows the same ARIA patterns. Use it to understand *what* to build and *which CDK to use* — **never copy its code directly**.

Material uses outdated Angular patterns. Adapt to the idioms in `{conventions}`; the defaults:

| Material pattern | Current idiom |
|---|---|
| `@Input() foo` | `foo = input()` |
| `@Output() fooChange` | `fooChange = output()` |
| `NgModule` imports | standalone `imports: []` |
| `ngOnInit` / `ngOnChanges` | `effect()` / `computed()` |
| `@ViewChild` + imperative DOM | signals + template refs |
| `ViewEncapsulation.None` | `Emulated` unless `{conventions}` § Styling allows it |
| MDC/Material design tokens | the DS's tokens (`tokens.sources`, `tokens.allowed`) |
| `::ng-deep` | CSS custom property override API |

## Angular Material GitHub Reference

Fetch source files using `WebFetch` in parallel:

```
https://raw.githubusercontent.com/angular/components/main/src/material/<component>/<file>
```

| File | What it reveals |
|---|---|
| `<component>.ts` | Inputs, outputs, host bindings |
| `<component>-base.ts` | Base class / mixins (if exists) |
| `<component>.html` | Template structure and slots |
| `<component>.scss` | Token usage and override API |
| `testing/<component>-harness.ts` | Full public API surface |

If a file 404s, skip and continue.

### Known component paths

| Component | Key files |
|---|---|
| autocomplete | `autocomplete.ts`, `autocomplete-trigger.ts` |
| button | `button.ts`, `button.html`, `button.scss` |
| checkbox | `checkbox.ts`, `checkbox.html` |
| chips | `chip.ts`, `chip-listbox.ts`, `chip-input.ts` |
| dialog | `dialog.ts`, `dialog-container.ts` |
| expansion | `expansion-panel.ts`, `expansion-panel-header.ts` |
| form-field | `form-field.ts`, `form-field.html`, `form-field.scss` |
| menu | `menu.ts`, `menu-trigger.ts`, `menu.html` |
| radio | `radio.ts`, `radio.html` |
| select | `select.ts`, `select.html` |
| slide-toggle | `slide-toggle.ts`, `slide-toggle.html` |
| slider | `slider.ts`, `slider-thumb.ts` |
| snack-bar | `snack-bar.ts`, `snack-bar-container.ts` |
| stepper | `stepper.ts`, `step-header.ts` |
| tabs | `tab-group.ts`, `tab.ts`, `tab-header.ts` |
| tooltip | `tooltip.ts`, `tooltip.html` |
| tree | `tree.ts`, `node.ts` |

Full list and supplementary sources (Storybook, CHANGELOG, tokens):
`https://material.angular.io/components/<component>/api`

## Angular Primitives

**Angular Primitives (`ng-primitives`)** is a collection of unstyled, accessible Angular directives designed for building design systems.

- Package: `ng-primitives` — one entrypoint per primitive
- All Angular directives — composable, no built-in styles, you own the markup
- Accessible by default — ARIA wiring and keyboard handling included

### Angular Primitives Selection Table

| Component pattern | ng-primitives primitive | Import |
|---|---|---|
| Button | `NgpButton` | `ng-primitives/button` |
| Checkbox | `NgpCheckbox` | `ng-primitives/checkbox` |
| Radio group | `NgpRadioGroup` / `NgpRadioButton` | `ng-primitives/radio` |
| Switch / toggle | `NgpSwitch` | `ng-primitives/switch` |
| Input (accessible) | `NgpInput` | `ng-primitives/input` |
| Textarea (accessible) | `NgpTextarea` | `ng-primitives/textarea` |
| Select | `NgpSelect` | `ng-primitives/select` |
| Combobox | `NgpCombobox` | `ng-primitives/combobox` |
| Slider | `NgpSlider` | `ng-primitives/slider` |
| Range slider | `NgpRangeSlider` | `ng-primitives/range-slider` |
| OTP input | `NgpInputOtp` | `ng-primitives/input-otp` |
| Search input | `NgpSearch` | `ng-primitives/search` |
| Number field | `NgpNumberField` | `ng-primitives/number-field` |
| Accordion / expansion | `NgpAccordion` | `ng-primitives/accordion` |
| Tabs | `NgpTabs` | `ng-primitives/tabs` |
| Toolbar | `NgpToolbar` | `ng-primitives/toolbar` |
| Separator | `NgpSeparator` | `ng-primitives/separator` |
| Breadcrumbs | `NgpBreadcrumbs` | `ng-primitives/breadcrumbs` |
| Pagination | `NgpPagination` | `ng-primitives/pagination` |
| Navigation menu | `NgpNavigationMenu` | `ng-primitives/navigation-menu` |
| Toggle | `NgpToggle` | `ng-primitives/toggle` |
| Toggle group | `NgpToggleGroup` | `ng-primitives/toggle-group` |
| Dialog / modal | `NgpDialog` | `ng-primitives/dialog` |
| Popover | `NgpPopover` | `ng-primitives/popover` |
| Tooltip | `NgpTooltip` | `ng-primitives/tooltip` |
| Context menu | `NgpContextMenu` | `ng-primitives/context-menu` |
| Menu / dropdown | `NgpMenu` | `ng-primitives/menu` |
| Toast | `NgpToast` | `ng-primitives/toast` |
| Progress | `NgpProgress` | `ng-primitives/progress` |
| Meter | `NgpMeter` | `ng-primitives/meter` |
| Avatar | `NgpAvatar` | `ng-primitives/avatar` |
| Listbox | `NgpListbox` | `ng-primitives/listbox` |
| Date picker | `NgpDatePicker` | `ng-primitives/date-picker` |
| File upload | `NgpFileUpload` | `ng-primitives/file-upload` |
| Form field | `NgpFormField` | `ng-primitives/form-field` |
| Roving focus | `NgpRovingFocus` | `ng-primitives/roving-focus` |
| Focus trap | `NgpFocusTrap` | `ng-primitives/focus-trap` |
| Visually hidden | `NgpVisuallyHidden` | `ng-primitives/visually-hidden` |
| Hover interaction | `NgpHover` | `ng-primitives/hover` |
| Press interaction | `NgpPress` | `ng-primitives/press` |
| Focus interaction | `NgpFocus` | `ng-primitives/focus` |

### How to query Angular Primitives

**Via MCP (preferred):** the package ships an `ngp-mcp` server. When `ToolSearch(query: "ng-primitives")` finds it, use it. To add it: `mcpServers` entry `"ng-primitives": { "type": "stdio", "command": "<project>/node_modules/.bin/ngp-mcp" }` in the user's settings.

**Via WebFetch (fallback):**
```
WebFetch("https://angularprimitives.com/primitives/{primitive-name}")
```

Full overview: `https://angularprimitives.com/assets/llms/llms.txt`

### Truly no primitive available?

If no library in `sources.primitives` fits:
1. Check the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) for the interaction pattern
2. Implement keyboard handling via the `host` property (never `@HostListener`)
3. Document in a comment why no primitive was used
