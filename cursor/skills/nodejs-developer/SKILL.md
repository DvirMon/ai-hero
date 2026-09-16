---
name: nodejs-developer
description: Generates Node.js code and provides architectural guidance for greenfield Node.js HTTP API backend projects. Primary target is Node.js v22 LTS; see references/version-notes.md for v18/v20 deltas if the project pins an older version. Trigger for best practices on asynchronous flow (promises, streams, worker threads, AbortController), HTTP routing and middleware, body/schema validation, authentication and authorization (JWT/OAuth/RBAC), data access and caching, security hardening, observability, testing (node:test), or performance and deployment. Make sure to use this skill whenever the user is writing, reviewing, or refactoring Node.js backend/API code, even if they don't explicitly ask for "best practices."
license: MIT
metadata:
  author: Dvir Monajem
  version: '1.0'
  target: Node.js v22 LTS (primary); v18/v20 deltas noted separately
  scope: Greenfield HTTP API backend services. Out of scope — microservices/distributed-systems architecture (service decomposition, inter-service comms, gateways); CLI tools; libraries/packages; frontend-adjacent concerns.
portedFrom: 4986df278081
portedSelf: 4986df278081
---

# Node.js Developer Guidelines

> **Primary target: Node.js v22 LTS, greenfield HTTP API backend.** If the project pins an older LTS (v18/v20), read [version-notes.md](references/version-notes.md) first for deltas before applying guidance below. Distributed-systems/microservices patterns are explicitly out of scope for this hub.

## Runtime & Module System
- ESM-first, `require(esm)` interop, `import.meta`: [esm-and-modules.md](references/esm-and-modules.md)
- Built-in `fetch`, `WebSocket`, `FormData`, `URL`/`URLSearchParams`: [native-web-apis.md](references/native-web-apis.md)
- `--env-file`, `node --run`, `process.loadEnvFile`: [env-and-cli.md](references/env-and-cli.md)
- Version deltas (v18/v20 vs v22 — what's unavailable or unstable below the primary pin): [version-notes.md](references/version-notes.md)
- Generation guardrail — outdated patterns never to produce in new code: [forbidden-patterns.md](references/forbidden-patterns.md)

## Asynchronous & Concurrency Patterns
- Promise composition, async/await, error propagation: [promises-and-async-await.md](references/promises-and-async-await.md)
- Cancellation across fs/network APIs: [abort-controller.md](references/abort-controller.md)
- CPU-bound offload, structured-clone transfer: [worker-threads.md](references/worker-threads.md)
- Blocking anti-patterns and diagnosis: [event-loop-and-blocking.md](references/event-loop-and-blocking.md)

## HTTP Server & API Routing
- Fastify vs Express vs NestJS vs Hono selection criteria: [framework-selection.md](references/framework-selection.md)
- Route/controller layout, thin-handler pattern: [route-structure.md](references/route-structure.md)
- URI/header versioning, contract-first design: [api-versioning.md](references/api-versioning.md)

## Middleware & Request Pipeline
- Ordering, composition, error-first contracts: [middleware-ordering.md](references/middleware-ordering.md)
- Framework-specific hook semantics (Express middleware vs Fastify lifecycle vs Nest interceptors/guards/pipes): [framework-hook-semantics.md](references/framework-hook-semantics.md)

## Validation & Type Safety
- Schema-first validation for body/params/query/headers (Zod default): [schema-validation.md](references/schema-validation.md)
- TypeScript in Node.js (native strip-types status by version, `tsx` fallback): [typescript-in-nodejs.md](references/typescript-in-nodejs.md)

## Error Handling & Process Resilience
- Centralized error middleware, operational vs programmer errors: [centralized-error-handling.md](references/centralized-error-handling.md)
- Signal handling checklist (`SIGTERM`, `SIGINT`, `uncaughtException`, `unhandledRejection`) and graceful shutdown: [graceful-shutdown.md](references/graceful-shutdown.md)

## Data Access, Persistence & Caching
- ORM/ODM selection (Prisma, Drizzle, Mongoose): [orm-selection.md](references/orm-selection.md)
- Pooling, transaction boundaries, retry on transient failure: [connection-pooling-and-transactions.md](references/connection-pooling-and-transactions.md)
- Cache-aside patterns, Redis integration: [caching-patterns.md](references/caching-patterns.md)

## Authentication & Authorization
- JWT issuance/verification, refresh rotation: [jwt-and-sessions.md](references/jwt-and-sessions.md)
- OAuth 2.0 / OIDC flows: [oauth-oidc.md](references/oauth-oidc.md)
- Role/permission guard patterns: [rbac-guards.md](references/rbac-guards.md)

## Security Hardening
- CORS, rate limiting, `helmet` headers, payload limits: [http-hardening.md](references/http-hardening.md)
- Secret management, TLS defaults: [secrets-and-tls.md](references/secrets-and-tls.md)

## Observability & Logging
- Structured, machine-parseable logging: [structured-logging.md](references/structured-logging.md)
- Tracing and metrics, diagnostics channel: [tracing-and-metrics.md](references/tracing-and-metrics.md)

## Testing
- `node:test` (coverage, mocking, watch mode): [node-test-runner.md](references/node-test-runner.md)
- Endpoint testing (`supertest` / `fastify.inject()`): [http-integration-testing.md](references/http-integration-testing.md)
- Isolated database tests (Testcontainers): [database-testing.md](references/database-testing.md)

## Performance, Profiling & Deployment
- Clustering vs container replicas: [clustering-and-scaling.md](references/clustering-and-scaling.md)
- Heap snapshots, flame graphs, leak diagnosis: [profiling-and-leaks.md](references/profiling-and-leaks.md)
- Process management (PM2 vs orchestrator-native restarts): [process-management.md](references/process-management.md)

---

## Related hubs

Some topics above are ecosystem-specific expressions of universal engineering principles (thin controllers, separation of concerns, dependency direction, testability). This hub covers only the Node-specific "how." The underlying "why" belongs in a `backend-architecture` agnostic hub, which does not exist yet — flag if you want it drafted.

Distributed-systems/microservices patterns (service decomposition, inter-service communication, gateways) are out of scope for this hub entirely — a separate, language-agnostic hub would be needed if that's ever wanted.
