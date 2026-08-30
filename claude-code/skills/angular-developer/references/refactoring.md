# Refactoring — Angular Migration Schematics

**Always prefer a schematic over manual rewrites.** Schematics perform full-program analysis across TypeScript and templates, handling imports, cross-file references, and edge cases manual edits miss.

## Before Running Any Schematic

1. Read the affected `.ts` and `.html` files to identify which legacy patterns are present.
2. Pick the schematic from the quick-pick table below.
3. Run it — scope with `--path` when only a subset of the project needs migration. Use `--insertTodos` (where supported) to flag anything the schematic can't safely migrate.
4. Run `ng build` to verify no errors were introduced.

---

## Quick-Pick Table

| Legacy pattern | Modern replacement | Schematic | Min Angular |
|---|---|---|---|
| `@Input()` | `input()` / `input.required()` | `signal-input-migration` | 17.1 |
| `@Output()` + `EventEmitter` | `output()` | `output-migration` | 17.3 |
| `@ViewChild/Children`, `@ContentChild/Children` | `viewChild/Children()`, `contentChild/Children()` | `signal-queries-migration` | 17.2 |
| All three above in one pass | — | `signals` | 17.3 |
| `constructor(private svc: Svc)` | `inject(Svc)` | `inject-migration` | 14 |
| `*ngIf` / `*ngFor` / `*ngSwitch` | `@if` / `@for` / `@switch` | `control-flow-migration` | 17 |
| `NgModule`-based components | `standalone: true` | `standalone-migration` | 15.2 |
| Eager route imports | `loadComponent()` lazy loading | `route-lazy-loading-migration` | 17 |
| Unused `imports[]` entries | — | `cleanup-unused-imports` | 19 |
| `[(ngModel)]` | `model()` | ⚠️ no schematic — manual only | — |

---

## Schematics Reference

### `signal-input-migration`

```bash
ng generate @angular/core:signal-input-migration
ng generate @angular/core:signal-input-migration --path=src/app/feature
ng generate @angular/core:signal-input-migration --insertTodos
ng generate @angular/core:signal-input-migration --bestEffortMode
```

**Skipped:** accessor inputs (`get`/`set`), inputs written from outside the component, `spyOn()` targets in tests, manually instantiated classes (`new MyComp()`).

---

### `output-migration`

```bash
ng generate @angular/core:output-migration
ng generate @angular/core:output-migration --path=src/app/feature
```

**Skipped:** outputs assigned to a `Subject`, outputs whose `.pipe()` is used in production code, non-string aliases. Test files: `.pipe()` usages are wrapped in `toObservable()` automatically.

---

### `signal-queries-migration`

Drops the `static` option (signal queries are always static-equivalent). Unwraps `QueryList<T>` → `T`.

```bash
ng generate @angular/core:signal-queries-migration
ng generate @angular/core:signal-queries-migration --path=src/app/feature
ng generate @angular/core:signal-queries-migration --insertTodos
ng generate @angular/core:signal-queries-migration --bestEffortMode
```

**Skipped:** queries whose `.changes` or `.dirty` is accessed, queries overridden in subclasses, manually instantiated classes.

---

### `signals` — all three in one pass

```bash
ng generate @angular/core:signals
ng generate @angular/core:signals --migrations=inputs --migrations=queries
ng generate @angular/core:signals --path=src/app --bestEffortMode --insertTodos
```

---

### `inject-migration`

Handles `@Optional`, `@Self`, `@SkipSelf`, `@Host`, `@Attribute`, `@Inject(TOKEN)`, and `forwardRef`.

```bash
ng generate @angular/core:inject-migration
ng generate @angular/core:inject-migration --path=src/app/feature
ng generate @angular/core:inject-migration --migrateAbstractClasses
ng generate @angular/core:inject-migration --backwardsCompatibleConstructors
```

---

### `control-flow-migration`

Also removes now-redundant imports (`NgIf`, `NgFor`, `NgSwitch`, `CommonModule`) from standalone `imports[]`.

```bash
ng generate @angular/core:control-flow-migration
ng generate @angular/core:control-flow-migration --path=src/app/feature
```

**Known limitations:**
- `*ngFor="let x of items as alias"` — `as` alias has no `@for` equivalent; remove manually before re-running.
- i18n nesting conflicts — reported as error; requires manual resolution.

---

### `standalone-migration`

Three phases — run **in order**, verify `ng build` between each.

```bash
# Phase 1: Add standalone: true, populate imports[]
ng generate @angular/core:standalone-migration --mode=convert-to-standalone

# Phase 2: Remove empty NgModules
ng generate @angular/core:standalone-migration --mode=prune-ng-modules

# Phase 3: Switch bootstrapModule → bootstrapApplication
ng generate @angular/core:standalone-migration --mode=standalone-bootstrap
```

Each phase accepts `--path=src/app/feature`.

---

### `route-lazy-loading-migration`

Requires standalone components — does not touch NgModule-based routing.

```bash
ng generate @angular/core:route-lazy-loading-migration
ng generate @angular/core:route-lazy-loading-migration --path=src/app
```

---

### `cleanup-unused-imports`

```bash
ng generate @angular/core:cleanup-unused-imports
```

---

## NgModel / Two-Way Binding — No Schematic

`ngModel` is not deprecated. To migrate to signal-based two-way binding, use `model()` manually:

```ts
// Before
@Input() value = 0;
@Output() valueChange = new EventEmitter<number>();

// After
value = model(0);
```

---

## `ng update` — Version Migrations

Run automatically during `ng update @angular/core@<version>`. Do not invoke manually.
