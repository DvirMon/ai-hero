# Unit Testing — Angular Examples

> Principle and test/skip rules live in `unit-testing.md` (agnostic). This file is Angular/Vitest syntax only. This repo uses `@analogjs/vitest-angular` — not Karma/Jasmine.

## Setup Function

Every spec file should define a `setup()` factory. No raw `TestBed.createComponent` in individual tests.

```typescript
function setup(overrides: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({ imports: [BannerComponent] });
  const fixture = TestBed.createComponent(BannerComponent);

  const defaults: Record<string, unknown> = { variant: 'info', dismissible: false };
  const inputs = { ...defaults, ...overrides };

  Object.entries(inputs).forEach(([key, value]) =>
    fixture.componentRef.setInput(key, value)
  );
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, element: fixture.nativeElement };
}

// each test only specifies what's different
it('should show close button when dismissible', () => {
  const { element } = setup({ dismissible: true });
  expect(element.querySelector('[role="button"]')).toBeTruthy();
});
```

## What to Test

### Computed state with conditions

```typescript
it('should mark as non-interactive when disabled', () => {
  fixture.componentRef.setInput('disabled', true);
  expect(component.isInteractive()).toBe(false);
});
```

### Output emissions triggered by logic

```typescript
it('should emit dismiss when close is called and component is not disabled', () => {
  let dismissed = false;
  component.dismissed.subscribe(() => (dismissed = true));
  component.close();
  expect(dismissed).toBe(true);
});

it('should not emit dismiss when disabled', () => {
  let dismissed = false;
  component.dismissed.subscribe(() => (dismissed = true));
  fixture.componentRef.setInput('disabled', true);
  component.close();
  expect(dismissed).toBe(false);
});
```

### Observer-based calculations (resize, intersection)

```typescript
it('should set hasOverflow to true when content height exceeds container', () => {
  triggerResizeObserver({ contentHeight: 200, containerHeight: 100 });
  expect(component.hasOverflow()).toBe(true);
});

it('should set hasOverflow to false when content fits', () => {
  triggerResizeObserver({ contentHeight: 80, containerHeight: 100 });
  expect(component.hasOverflow()).toBe(false);
});
```

### State derived from multiple inputs

```typescript
it('should use danger variant when hasError is true and no explicit variant is set', () => {
  fixture.componentRef.setInput('hasError', true);
  fixture.componentRef.setInput('variant', undefined);
  expect(component.effectiveVariant()).toBe('danger');
});

it('should respect explicit variant even when hasError is true', () => {
  fixture.componentRef.setInput('hasError', true);
  fixture.componentRef.setInput('variant', 'warning');
  expect(component.effectiveVariant()).toBe('warning');
});
```

### Guard logic (method returns early or throws)

```typescript
it('should not open when already open', () => {
  component.open();
  let openCount = 0;
  component.opened.subscribe(() => openCount++);
  component.open(); // second call
  expect(openCount).toBe(0);
});
```

## What NOT to Test

### CSS class presence for its own sake

```typescript
// BAD: Tests the template binding, not logic
it('should have class primary when variant is primary', () => {
  expect(el.classList.contains('primary')).toBe(true);
});
```

### Content projection

```typescript
// BAD: ng-content projection is Angular's responsibility
it('should project slotted content', () => { ... });
```

### Static HTML structure

```typescript
// BAD: Not logic
it('should render an icon element', () => {
  expect(el.querySelector('{prefix}-icon-2')).toBeTruthy();
});
```

### Simple input passthrough with no logic

```typescript
// BAD: Not logic — just a binding, no conditions
it('should pass the variant value to the host', () => { ... });
```
