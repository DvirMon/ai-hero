# Creating and Using Services

Services in Angular are reusable pieces of code that handle data fetching, business logic, or state management that multiple components or other services need to access.

## Creating a Service

You can generate a service using the Angular CLI:

```bash
ng generate service my-data
```

Or you can manually create a TypeScript class and decorate it with `@Service()`.

```ts
import {Service} from '@angular/core';

@Service()
export class BasicDataStore {
  private data: string[] = [];

  addData(item: string): void {
    this.data.push(item);
  }

  getData(): string[] {
    return [...this.data];
  }
}
```

### The `@Service` decorator

Using `@Service` is the recommended approach for most services. It tells Angular to:

- **Create a single instance (singleton)** for the entire application.
- **Make it available everywhere** automatically, without needing to list it in any `providers` array.
- **Enable tree-shaking**, meaning the service is only included in the final JavaScript bundle if it is actually injected somewhere.

#### The `autoProvided` option

If you don't want to create a singleton of your service, you can set `@Service({autoProvided: false})` and declare the service a `providers` array.

## Injecting a Service

Once a service is created, you can inject it into components, directives, or other services using the `inject()` function.

### Injecting into a Component

```ts
import {Component, inject} from '@angular/core';
import {BasicDataStore} from './basic-data-store.service';

@Component({
  selector: 'app-example',
  template: `
    <div>
      <p>Data items: {{ dataStore.getData().length }}</p>
      <button (click)="dataStore.addData('New Item')">Add Item</button>
    </div>
  `,
})
export class Example {
  // Inject the service as a class field
  dataStore = inject(BasicDataStore);
}
```

### Injecting into Another Service

Services can inject other services in the exact same way.

```ts
import {Injectable, inject} from '@angular/core';
import {AdvancedDataStore} from './advanced-data-store.service';

@Service()
export class BasicDataStore {
  // Injecting another service
  private advancedDataStore = inject(AdvancedDataStore);

  private data: string[] = [];

  getData(): string[] {
    // Combine data from this service and the injected service
    return [...this.data, ...this.advancedDataStore.getData()];
  }
}
```

## Lazy Loading Services with `injectAsync` (v22+)

`injectAsync` splits a service into its own JS chunk and loads it on demand. Use for services backed by large libraries or infrequently used features.

**Requirement:** the service must be auto-provided (`@Injectable({ providedIn: 'root' })` or `@Service()`).

```ts
import { Component, injectAsync } from '@angular/core';
import { onIdle } from '@angular/core';

@Component({ ... })
export class MyCmp {
  private readonly analyticsService = injectAsync(() => import('./analytics.service').then(m => m.AnalyticsService));

  async onButtonClick() {
    const analytics = await this.analyticsService();
    analytics.track('button_click');
  }
}
```

Prefetch before the user triggers the action:

```ts
// Prefetch while browser is idle, load on demand
private readonly heavySvc = injectAsync(
  () => import('./heavy.service').then(m => m.HeavyService),
  { prefetch: onIdle }
);
```

## Advanced Service Patterns

While `@Service` covers most scenarios, you may sometimes need:

- **Component-specific instances**: If a component needs its own isolated instance of a service, provide it directly in the component's `@Component({ providers: [MyService] })` array and set the `autoProvided: false` option: `@Service({autoProvided: false})`
- **Factory providers**: For dynamic creation.
- **Value providers**: For injecting configuration objects.
