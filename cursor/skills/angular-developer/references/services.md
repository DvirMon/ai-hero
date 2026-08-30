# Services

Services encapsulate shared logic, state, and data access. Design services around a single, well-defined responsibility.

## Basic Service

```ts
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getUser(id: string) {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
```

Use `providedIn: 'root'` for application-wide singletons. For scoped services, provide at the component level.

## Service State Pattern

Expose readonly signals from services; keep writable signals private:

```ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _$user = signal<User | null>(null);
  private readonly _$loading = signal(false);

  readonly $user = this._$user.asReadonly();
  readonly $loading = this._$loading.asReadonly();
  readonly $isAuthenticated = computed(() => this._$user() !== null);

  async login(credentials: Credentials): Promise<void> {
    this._$loading.set(true);
    try {
      const user = await this.http.post<User>('/api/login', credentials).toPromise();
      this._$user.set(user ?? null);
    } finally {
      this._$loading.set(false);
    }
  }
}
```

## Single Responsibility

Each service should do one thing well. Split services when they grow beyond a single domain:

```ts
// ✅ Good: focused responsibilities
@Injectable({ providedIn: 'root' }) export class UserHttpService { /* HTTP only */ }
@Injectable({ providedIn: 'root' }) export class UserStateService { /* state only */ }
@Injectable({ providedIn: 'root' }) export class UserValidationService { /* validation only */ }
```

## Facade Pattern

When a component injects too many services, extract a **facade** to centralize domain behavior and reduce injection overhead.

```ts
// ❌ Bad: component injecting too many services
@Component({ standalone: true })
export class RegisterComponent {
  private readonly store = inject(RegisterStore);
  private readonly http = inject(RegisterHttp);
  private readonly utils = inject(RegisterUtils);
}
```

```ts
// ✅ Good: facade centralizes the domain
@Injectable({ providedIn: 'root' })
export class RegisterService {
  // Members are public only in a facade — this is the exception to private-by-default
  readonly store = inject(RegisterStore);
  readonly http = inject(RegisterHttp);
  readonly utils = inject(RegisterUtils);
}

@Component({ standalone: true })
export class RegisterComponent {
  private readonly registerService = inject(RegisterService);
}
```

> **Only expose service members as `public` inside a facade.** All other services use `private readonly` for injected dependencies.

## Avoid Exposing Services to Templates

Never expose a service directly to the template. Expose signals or methods instead:

```ts
// ❌ Bad
@Component({ template: `{{ userService.getCurrentUser() }}` })
export class BadComponent {
  userService = inject(UserService); // public — leaks to template
}

// ✅ Good
@Component({ template: `{{ $currentUser() }}` })
export class GoodComponent {
  private readonly userService = inject(UserService);
  protected readonly $currentUser = this.userService.$user;
}
```

## Best Practices

- Always use `private readonly` when injecting services into components and other services.
- Use `providedIn: 'root'` for singletons.
- Expose state as readonly signals from services.
- Use the facade pattern when a component would otherwise inject 3+ related services.
- Keep services free of template concerns — no `ElementRef`, no DOM access.
