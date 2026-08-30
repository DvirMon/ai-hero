# HTTP Interceptors

Use functional interceptors (`HttpInterceptorFn`). Never use class-based interceptors.

## Registration

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loggingInterceptor])
    ),
  ],
};
```

Interceptors run in order — `authInterceptor` runs first on the way out, last on the way back.

---

## Auth Interceptor

Attaches a Bearer token to every outgoing request.

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
```

---

## Error Interceptor

Centralizes HTTP error handling — auth redirects, toast notifications, re-throw for call-site handling.

```ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from './notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const router = inject(Router);
      const notify = inject(NotificationService);

      if (err.status === 401) {
        router.navigate(['/login']);
      } else if (err.status === 403) {
        router.navigate(['/forbidden']);
      } else if (err.status >= 500) {
        notify.error('Server error. Please try again.');
      }

      return throwError(() => err); // re-throw so call-site can also react
    }),
  );
```

**Always re-throw** — interceptors are infrastructure, not the final handler. Call-site `catchError` still runs.

---

## Logging Interceptor

Logs request duration and status for observability.

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { AnalyticsService } from './analytics.service';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const analytics = inject(AnalyticsService);
  const start = Date.now();

  return next(req).pipe(
    tap({
      next: res => analytics.track(req.url, res.status, Date.now() - start),
      error: (err: HttpErrorResponse) => analytics.track(req.url, err.status, Date.now() - start),
    }),
  );
};
```

---

## Retry Interceptor

Retries transient failures (network errors, 503) with exponential backoff.

```ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { retry, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: 2,
      delay: (err: HttpErrorResponse, attempt) =>
        err.status === 503 ? timer(attempt * 1000) : throwError(() => err),
    }),
  );
```

---

## Decision Guide

| Need | Interceptor |
|---|---|
| Attach auth token globally | `authInterceptor` |
| Redirect on 401/403 | `errorInterceptor` |
| Show toast on 5xx | `errorInterceptor` |
| Log latency / status | `loggingInterceptor` |
| Retry on 503 / network flap | `retryInterceptor` |
| Handle one endpoint's errors | `catchError` at call-site (not interceptor) |
