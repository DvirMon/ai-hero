# Security (code-level)

Dependencies are out of scope — Dependabot and CodeQL own them. This file
covers what the diff itself does with untrusted data.

## Untrusted sources

Treat as untrusted unless the code proves otherwise:

- Consumer-supplied config, callbacks, column defs, cell values
- Row data, and anything derived from it (keys, labels, ids)
- URL / query params, `localStorage`, `sessionStorage`, `postMessage`
- HTTP responses, SSR `TransferState` payloads

Library authors: the *consumer* is trusted to wire the library, but
**their end users' data flowing through it is not**. A row value is
untrusted even when the consumer is.

## Sinks and what earns P0/P1

| Sink | P0/P1 when | Usually not a finding when |
|---|---|---|
| `innerHTML`, `insertAdjacentHTML`, `bypassSecurityTrust*` | Untrusted string reaches it unsanitized | Static literal; Angular-sanitized binding |
| `eval`, `new Function` | Any untrusted fragment reaches it | — (still flag P2: remove) |
| `[href]`/`[src]`/`[action]` from data | `javascript:` / `data:` URL possible and Angular sanitization bypassed | Plain Angular binding (sanitized by default) |
| `new RegExp(input)` | Untrusted pattern, or untrusted text against a catastrophic pattern → ReDoS | Escaped input; spec-only code |
| `Object.assign`, spread, `obj[key] = v` | Key or source object comes from row/consumer data → `__proto__` / `constructor.prototype` write | Keys from a closed, library-owned set |
| `TransferState` | Server-rendered state rehydrated into a sink above | SSR not in use |

## Evidence

P0/P1 need the full path: `source (file:line) → … → sink (file:line)`.
Missing a link → P2 at most, stated as "reachable if X". No path at all →
drop it.

## Deeper pass

The built-in `/security-review` does a whole-branch pass. Mention it in
the report when any P0/P1 security finding survives verification.
