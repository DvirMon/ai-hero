# CLAUDE.md holds invariants, never status

A `CLAUDE.md` must not carry implementation status: no
"migration in flight / #N pending", no "not yet implemented /
not wired / TBD", no duplicated ADR `proposed`/`accepted`
markers. It holds durable invariants, conventions and rules.

Status lives where it is canonical — a generated `docs/status.md`,
the ADR file itself, the public barrel for what is actually
exported. CLAUDE.md points there instead of restating it.

**Why:** a lib's CLAUDE.md said "#69 landed, #72-#74 pending"
long after all four closed. Because CLAUDE.md is injected into
every session, I reasoned from it and told the user a closed
issue was mid-flight, skipping a one-call `gh issue view`.
Stale status in an always-loaded file propagates silently into
conclusions. The same paragraph also claimed a stories folder
"does not compile" — which would have had someone dismiss real
compile errors as expected.

**How to apply:** when editing a CLAUDE.md, keep the rule and
drop the state. Rewrite "ADR-0014 (`proposed`)" to "ADR-0014";
rewrite "X is still unguarded pending the retrofit" to the
durable half ("absence of a wrap is not precedent — check the
ADR, not neighbouring code"). Delete status-only sections
outright. When a status claim in any always-loaded file is
about to drive a decision, verify it against the source of
truth first — cheap, and routinely stale.

Same instinct applied to third-party APIs and in-repo ADRs:
[[verify-facts-from-source]].
