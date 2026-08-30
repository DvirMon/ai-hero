# HTTP

## Choosing the Right API

| Use case | API | Reference |
|----------|-----|-----------|
| Simple HTTP GET (with interceptors) | `httpResource()` | [resource.md](resource.md) |
| Any async task (fetch, Promise, worker) | `resource()` | [resource.md](resource.md) |
| RxJS Observable-based APIs | `rxResource()` | [resource.md](resource.md) |
| Complex operators / non-GET mutations | `HttpClient` | below |
| Auth, error, logging middleware | Interceptors | [interceptors.md](interceptors.md) |

---

## `HttpClient` — Mutations & Complex Scenarios

Use `HttpClient` directly for non-GET mutations or when you need advanced RxJS operators.

```ts
private readonly http = inject(HttpClient);

// Convert GET to signal
$users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });

// Mutations — use in methods, not fields
saveUser(user: User) {
  return this.http.post<User>('/api/users', user);
}

updateUser(id: string, changes: Partial<User>) {
  return this.http.patch<User>(`/api/users/${id}`, changes);
}
```

## Error Handling

```ts
getUser(id: string) {
  return this.http.get<User>(`/api/users/${id}`).pipe(
    retry(2),
    catchError((err: HttpErrorResponse) =>
      throwError(() => new Error(`Failed to load user: ${err.message}`))
    ),
  );
}
```

## Guidelines

- Always use `inject(HttpClient)` with `private readonly`.
- Use `httpResource()` for GETs — reserve `HttpClient` for mutations and complex operators.
- For error handling with resource APIs, see [resource.md](resource.md).
- For interceptors, see [interceptors.md](interceptors.md).
