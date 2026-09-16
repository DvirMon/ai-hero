---
name: angular-developer
description: Generates Angular code and provides architectural guidance. Trigger when creating projects, components, or services, or for best practices on reactivity (signals, linkedSignal, resource), forms, dependency injection, routing, SSR, accessibility (ARIA), animations, styling (component styles, Tailwind CSS), testing, or CLI tooling.
license: MIT
metadata:
  author: Copyright 2026 Google LLC
  version: '1.0'
portedFrom: 5a5749b63b70
portedSelf: 0194ed9912d0
---

# Angular Developer Guidelines

> **Role:** this skill is the *knowledge* SSOT for Angular conventions. Load it directly for
> both ad-hoc guidance and implementation work — read the relevant references below, then write
> the code yourself following rule 3 (run `ng build` after generating code).

---

## Legacy Syntax Policy (STRICT — applies to all code generation)

The following legacy Angular APIs are **FORBIDDEN in new code**. Never generate them. Never suggest them. Always use the modern equivalent.

| Legacy (NEVER use) | Modern (ALWAYS use) | Notes |
|---|---|---|
| `@Input()` decorator | `input()` / `input.required()` | Signal-based, reactive, type-safe |
| `@Output()` + `EventEmitter` | `output()` | No `EventEmitter` import needed |
| `@HostBinding()` | `host: { '[prop]': expr }` in metadata | Declarative, co-located |
| `@HostListener()` | `host: { '(event)': 'handler($event)' }` in metadata | Declarative, co-located |
| `@ViewChild()` / `@ViewChildren()` | `viewChild()` / `viewChildren()` | Signal-based queries |
| `@ContentChild()` / `@ContentChildren()` | `contentChild()` / `contentChildren()` | Signal-based queries |
| `*ngIf` / `*ngFor` / `*ngSwitch` | `@if` / `@for` / `@switch` | Built-in control flow |
| `[ngClass]` / `[ngStyle]` | `[class.*]` / `[style.*]` native bindings | No CommonModule import needed |
| `constructor(private svc: Service)` | `private svc = inject(Service)` | Functional injection |
| `NgModule` (for new code) | Standalone components | `standalone: true` is default; **do not write `standalone: true`** in v20+ (it's redundant) |
| `ngOnInit` for signal derivation | `computed()` / `effect()` | Reactive by default |
| `ngOnDestroy` for cleanup | `DestroyRef.onDestroy()` / `takeUntilDestroyed()` | Colocate setup and cleanup |
| `ChangeDetectionStrategy.Default` | `ChangeDetectionStrategy.OnPush` | `OnPush` is the default in v22+; `Default` renamed to `Eager` |

### Refactoring Guidance

When **editing a file that uses legacy syntax**:

1. **Complete the user's requested task first** using modern syntax only.
2. **After the task is done**, suggest a follow-up refactoring opportunity.
3. **Never mix** — if you add new inputs/outputs to a file with legacy ones, still use the modern API. Do not match the file's legacy style.
4. **Never refactor in the same change** unless the user explicitly asks for it.

### When Asked to Refactor Legacy Code

**Do not rewrite manually.** Angular ships official schematics that perform full-program analysis across TypeScript and templates. Always prefer a schematic over hand-editing.

**Protocol:**
1. Read the affected `.ts` and `.html` files to identify which legacy patterns are present.
2. Consult [refactoring.md](references/refactoring.md) to select the correct schematic.
3. Run the schematic (scoped with `--path` when appropriate).
4. Run `ng build` to verify no errors were introduced.

---

## Template Binding Policy (STRICT — applies to all template generation)

**Never add a class method purely to compute a render value** (e.g. `isSelected(item)`,
`getLabel(item)`). A method call in an interpolation or property/attribute binding re-runs on
every change-detection check and hides render logic behind an opaque call site. Only methods
triggered by an **event** binding (`(click)="activate(item)"`) belong in a template as calls.

| Binding shape | Use |
|---|---|
| No per-item param; reused across bindings | `computed()` |
| Per-item param inside `@for`, or reused across bindings on one row | `@let` over a signal read |
| Trivial one-off, no reuse | inline expression — no method, no `@let` |

If the helper does a per-row **lookup** (`rows().find(…)`, a filter, an index scan), calling it
from the template is O(n²) per change detection. Derive a `Set`/`Map` once in a `computed()` and
read `.has(id)` in the template.

Full examples: [templates.md](references/templates.md).

---

1. Always analyze the project's Angular version before providing guidance, as best practices and available features can vary significantly between versions. If creating a new project with Angular CLI, do not specify a version unless prompted by the user.

2. When generating code, follow Angular's style guide and best practices for maintainability and performance. Use the Angular CLI for scaffolding components, services, directives, pipes, and routes to ensure consistency.

3. Once you finish generating code, run `ng build` to ensure there are no build errors. If there are errors, analyze the error messages and fix them before proceeding. Do not skip this step, as it is critical for ensuring the generated code is correct and functional.

## Creating New Projects

If no guidelines are provided by the user, here are some default rules to follow when creating a new Angular project:

1. Use the latest stable version of Angular unless the user specifies otherwise.
2. Use Signals Forms for form management in new projects (available in Angular v21 and newer) [Find out more](references/signal-forms.md).

**Execution Rules for `ng new`:**
When asked to create a new Angular project, you must determine the correct execution command by following these strict steps:

**Step 1: Check for an explicit user version.**

- **IF** the user requests a specific version (e.g., Angular 15), bypass local installations and strictly use `npx`.
- **Command:** `npx @angular/cli@<requested_version> new <project-name>`

**Step 2: Check for an existing Angular installation.**

- **IF** no specific version is requested, run `ng version` in the terminal to check if the Angular CLI is already installed on the system.
- **IF** the command succeeds and returns an installed version, use the local/global installation directly.
- **Command:** `ng new <project-name>`

**Step 3: Fallback to Latest.**

- **IF** no specific version is requested AND the `ng version` command fails (indicating no Angular installation exists), you must use `npx` to fetch the latest version.
- **Command:** `npx @angular/cli@latest new <project-name>`

## Components

When working with Angular components, consult the following references based on the task:

- **Component class**: Metadata options (selector types, `host`), class member order, access modifiers, `on`-prefix event handlers, naming. Read [components.md](references/components.md)
- **Inputs**: Signal-based inputs, transforms, and model inputs. Read [inputs.md](references/inputs.md)
- **Outputs**: Signal-based outputs and custom event best practices. Read [outputs.md](references/outputs.md)
- **Host Elements**: Host bindings and attribute injection. Read [host-elements.md](references/host-elements.md)
- **Templates**: All template writing — control flow, `@let`, class/style bindings, minimal DOM nesting, typed form access, `NgOptimizedImage`. Read [templates.md](references/templates.md)
- **Lifecycle**: Signals-first lifecycle, `DestroyRef`, `afterNextRender`, `takeUntilDestroyed`. Read [lifecycle.md](references/lifecycle.md)
- **Directives**: Attribute, host directives, directive composition API, same-name alias convention. Read [directives.md](references/directives.md)
- **Structural Directives**: Portal, lazy render, domain-logic conditionals (role/permission), typed template outlet, microsyntax. Read [structural-directives.md](references/structural-directives.md)
- **Deferred Loading (`@defer`)**: Sub-blocks (`@placeholder`, `@loading`, `@error`), triggers (`on idle/viewport/interaction/hover/immediate/timer`, `when`, `prefetch`), SSR behavior, testing, a11y. Read [defer.md](references/defer.md)
If you require deeper documentation not found in the references above, read the documentation at `https://angular.dev/guide/components`.

Before finishing a component: check whether any inline lifecycle logic (an `afterNextRender` +
`DestroyRef` acquire/release pair, a listener, a timer) or inline object-builder has its own
coherent scope separable from the host — reuse is not required to justify extraction. If the
repo has a `.claude/rules/extract-encapsulated-logic.md`, follow it.

## Error Handling

Angular error handling spans three layers — use the most localized layer that fits:

- **All three layers + decision guide**: call-site first (`try/catch`, `catchError`), template isolation (`@boundary`), global fallback (`ErrorHandler` + `provideBrowserGlobalErrorListeners`). Read [error-handling.md](references/error-handling.md)
- **Global HTTP error handling (interceptors)**: centralize auth errors (401/403), retries, and error logging across all HTTP calls via `HttpInterceptorFn`. Read [interceptors.md](references/interceptors.md)

## Reactivity and Data Management

When managing state and data reactivity, use Angular Signals and consult the following references:

- **Signals Overview**: Core signal concepts (`signal`, `computed`), reactive contexts, and `untracked`. Read [signals-overview.md](references/signals-overview.md)
- **Dependent State (`linkedSignal`)**: Creating writable state linked to source signals. Read [linked-signal.md](references/linked-signal.md)
- **Async Reactivity (`resource`)**: Fetching asynchronous data directly into signal state. Read [resource.md](references/resource.md)
- **Side Effects (`effect`)**: Logging, third-party DOM manipulation (`afterRenderEffect`), and when NOT to use effects. Read [effects.md](references/effects.md)
- **RxJS Interop**: Bridging signals and observables with `toSignal()`, `toObservable()`, `takeUntilDestroyed()`, `outputFromObservable()`, and `rxResource()`. Read [rxjs-interop.md](references/rxjs-interop.md)

## HTTP & Data Fetching

When implementing HTTP requests and data fetching, consult the following references:

- **Choosing the right API** (`httpResource` vs `resource` vs `HttpClient`), mutations, and error handling. Read [http.md](references/http.md)
- **Resource APIs** (`httpResource()`, `resource()`, `rxResource()`, state signals, loading states): Read [resource.md](references/resource.md)
- **Interceptors** (functional interceptors, auth, error handling, registration via `provideHttpClient`): Read [interceptors.md](references/interceptors.md)

## Forms

In most cases for new apps, **prefer signal forms**. When making a forms decision, analyze the project and consider the following guidelines:

- If the application is using v21 or newer and this is a new form, **prefer signal forms**.
- For older applications or when working with existing forms, use the appropriate form type that matches the applications current form strategy.

- **Signal Forms**: Use signals for form state management. Read [signal-forms.md](references/signal-forms.md)
- **Template-driven forms**: Use for simple forms. Read [template-driven-forms.md](references/template-driven-forms.md)
- **Reactive forms**: Use for complex forms. Read [reactive-forms.md](references/reactive-forms.md)

## Dependency Injection

When implementing dependency injection in Angular, follow these guidelines:

- **Fundamentals**: Overview of Dependency Injection, services, and the `inject()` function. Read [di-fundamentals.md](references/di-fundamentals.md)
- **Creating and Using Services**: Creating services, `@Service()` decorator (v22+), `providedIn: 'root'`, injecting into components/services, and lazy loading with `injectAsync()` (v22+). Read [creating-services.md](references/creating-services.md)
- **Defining Dependency Providers**: Automatic vs manual provision, `InjectionToken`, `useClass`, `useValue`, `useFactory`, and scopes. Read [defining-providers.md](references/defining-providers.md)
- **Injection Context**: Where `inject()` is allowed, `runInInjectionContext`, and `assertInInjectionContext`. Read [injection-context.md](references/injection-context.md)
- **Hierarchical Injectors**: The `EnvironmentInjector` vs `ElementInjector`, resolution rules, modifiers (`optional`, `skipSelf`), and `providers` vs `viewProviders`. Read [hierarchical-injectors.md](references/hierarchical-injectors.md)
- **Services**: Service state pattern (readonly signals), single responsibility, facade pattern. Read [services.md](references/services.md)

## Angular Aria

When building accessible custom components for any of the following patterns: Accordion, Listbox, Combobox, Menu, Tabs, Toolbar, Tree, Grid, consult the following reference:

- **Angular Aria Components**: Building headless, accessible components (Accordion, Listbox, Combobox, Menu, Tabs, Toolbar, Tree, Grid) and styling ARIA attributes. Read [angular-aria.md](references/angular-aria.md)

## Routing

When implementing navigation in Angular, consult the following references:

- **Define Routes**: URL paths, static vs dynamic segments, wildcards, and redirects. Read [define-routes.md](references/define-routes.md)
- **Route Loading Strategies**: Eager vs lazy loading, and context-aware loading. Read [loading-strategies.md](references/loading-strategies.md)
- **Show Routes with Outlets**: Using `<router-outlet>`, nested outlets, and named outlets. Read [show-routes-with-outlets.md](references/show-routes-with-outlets.md)
- **Navigate to Routes**: Declarative navigation with `RouterLink` and programmatic navigation with `Router`. Read [navigate-to-routes.md](references/navigate-to-routes.md)
- **Control Route Access with Guards**: Implementing `CanActivate`, `CanMatch`, and other guards for security. Read [route-guards.md](references/route-guards.md)
- **Data Resolvers**: Pre-fetching data before route activation with `ResolveFn`. Read [data-resolvers.md](references/data-resolvers.md)
- **Router Lifecycle and Events**: Chronological order of navigation events and debugging. Read [router-lifecycle.md](references/router-lifecycle.md)
- **Route Resources**: Signals-based route data fetching with `resources` + `withRouterResources()` (v21+) — parallel loads, non-blocking routes, reload without navigation. Read [route-resources.md](references/route-resources.md)
- **Rendering Strategies**: CSR, SSG (Prerendering), and SSR with hydration. Read [rendering-strategies.md](references/rendering-strategies.md)
- **Route Transition Animations**: Enabling and customizing the View Transitions API. Read [route-animations.md](references/route-animations.md)

If you require deeper documentation or more context, visit the [official Angular Routing guide](https://angular.dev/guide/routing).

## Styling and Animations

When implementing styling and animations in Angular, consult the following references:

- **Using Tailwind CSS with Angular**: Integrating Tailwind CSS into Angular projects. Read [tailwind-css.md](references/tailwind-css.md)
- **Angular Animations**: Using native CSS (recommended) or the legacy DSL for dynamic effects. Read [angular-animations.md](references/angular-animations.md)
- **Styling components**: Best practices for component styles and encapsulation. Read [component-styling.md](references/component-styling.md)

## Testing

When writing or updating tests, consult the following references based on the task:

- **Fundamentals**: Best practices for unit testing (Vitest), async patterns, and `TestBed`. Read [testing-fundamentals.md](references/testing-fundamentals.md)
- **Component Harnesses**: Standard patterns for robust component interaction. Read [component-harnesses.md](references/component-harnesses.md)
- **Router Testing**: Using `RouterTestingHarness` for reliable navigation tests. Read [router-testing.md](references/router-testing.md)
- **End-to-End (E2E) Testing**: Best practices for E2E tests with Cypress. Read [e2e-testing.md](references/e2e-testing.md)

## Tooling

When working with Angular tooling, consult the following references:

- **Angular CLI**: Creating applications, generating code (components, routes, services), serving, and building. Read [cli.md](references/cli.md)
- **Migration Schematics**: Quick-pick table of all official Angular schematics (`signal-input-migration`, `output-migration`, `signal-queries-migration`, `inject-migration`, `control-flow-migration`, `standalone-migration`, and more) with exact commands, flags, and minimum versions. Read [refactoring.md](references/refactoring.md)
- **Angular MCP Server**: Available tools, configuration, and experimental features. Read [mcp.md](references/mcp.md)
- **Environment Configuration**: Strategies for build-time and runtime configuration. Read [environment-configuration.md](references/environment-configuration.md)
