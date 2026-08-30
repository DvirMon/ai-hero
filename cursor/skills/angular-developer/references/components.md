# Components

Angular components are the fundamental building blocks of an application. A component is a TypeScript class decorated with `@Component` that pairs a CSS selector, an HTML template, and optional styles.

## Metadata Options

```ts
@Component({
  selector: 'app-profile',          // how this component is used in templates
  template: `...`,                   // inline HTML (prefer for small templates)
  templateUrl: './profile.html',     // external HTML file
  styles: `...`,                     // inline CSS
  styleUrl: './profile.css',         // single external CSS file
  styleUrls: ['./a.css', './b.css'], // multiple external CSS files
  imports: [OtherComponent, MyPipe], // components/directives/pipes used in this template
  host: {                            // host element bindings (replaces @HostBinding/@HostListener)
    '[class.active]': 'isActive()',
    '(click)': 'onClick($event)',
    'role': 'button',
  },
})
export class Profile { ... }
```

### Selector types

| Form | Example | Usage |
|---|---|---|
| Element | `selector: 'app-button'` | `<app-button />` — default for most components |
| Attribute | `selector: '[appHighlight]'` | `<div appHighlight>` — for directive-like components |
| CSS class | `selector: '.card'` | `<div class="card">` — rarely used, avoid unless intentional |

### `host` metadata

Always use `host: {}` in the decorator instead of `@HostBinding` / `@HostListener` decorators — it is declarative and co-located.

```ts
host: {
  '[attr.aria-disabled]': 'disabled()',   // attribute binding
  '[class.open]': 'isOpen()',             // class binding
  '[style.color]': 'color()',             // style binding
  '(keydown.enter)': 'onEnter($event)',   // event listener
  'role': 'listbox',                      // static attribute
}
```

## Class Member Order

Write class members in this order to make components scannable:

```ts
export class MyComponent {
  // 1. Injected dependencies
  private router = inject(Router);
  private userService = inject(UserService);

  // 2. Inputs
  label = input.required<string>();
  disabled = input(false);

  // 3. Outputs
  selected = output<Item>();

  // 4. DOM queries (only when needed — prefer template-driven flow)
  container = viewChild<ElementRef>('container');
  items = contentChildren(ItemComponent);

  // 5. Derived / internal state (computed signals, private fields)
  private count = signal(0);
  protected displayLabel = computed(() => this.label().toUpperCase());

  // 6. Event handlers and public methods
  onItemSelect(item: Item) {
    this.selected.emit(item);
  }

  // 7. Effects (last — they express side effects, not state)
  private syncEffect = effect(() => {
    this.router.navigate([this.label()]);
  });
}
```

## Access Modifiers

Reason about each member's visibility — don't default everything to `public`:

| Modifier | When to use |
|---|---|
| `private` | Internal implementation: injected services, internal signals, helpers never used in the template |
| `protected` | Accessed only by the template (Angular templates can reach `protected` members) |
| `public` (default) | Part of the public API: methods called by parent components, `@Input` equivalents consumed externally |

> Template-only members (`computed`, helper methods bound in `template`) should be `protected`, not `public`. Reserve `public` for genuine external API surface.

## Event Handler Naming — `on` Prefix + Context

Two rules, both required:

**1. Always prefix with `on`** — distinguishes handlers from business logic.

**2. Always include context** — the name must declare *what* is being acted on, not just *what action*. A reader should understand the responsibility from the name alone.

```ts
// ✅ correct — on + context + action
onCustomerSelect(customer: Customer) { ... }
onLoginFormSave() { ... }
onSearchInputChange(value: string) { ... }
onDeleteConfirmClick() { ... }

// ❌ avoid — action only, no context
onSelect() { ... }
onSave() { ... }
onChange() { ... }
onClick() { ... }

// ❌ avoid — no on prefix
select(item: Item) { ... }
handleClick() { ... }
```

In the template:

```html
<app-customer-list (customerSelect)="onCustomerSelect($event)" />
<button (click)="onLoginFormSave()">Save</button>
```

## Naming Conventions

- **No `Component` suffix** on class names unless the project is explicitly configured otherwise.
- Use PascalCase for the class: `UserCard`, `NavMenu`, `ProductGrid`.
- Match the selector prefix to the app/lib prefix configured in `angular.json`.

## Core Concepts

- **Standalone**: Since Angular 19, components are standalone by default (`standalone: true` is implicit). For pre-v19 code, `standalone: true` must be explicit.
- **Host Element**: The DOM element matching the component's selector. Style it via `:host` in component CSS or via `host` bindings in the decorator.
- **Component Tree**: Components compose into a tree. Parent passes data down via inputs; child communicates up via outputs.

For all template writing (control flow, DOM structure, bindings, images), see [templates.md](templates.md).
