# Verify a fact by opening the artifact, not from memory

Same failure in two places: asserting what something says
without reading it. Third-party APIs and in-repo design docs.

## Third-party library APIs

Never answer a factual question about a library's API (option
names, method semantics, state shape) from the knowledge base.
Fetch the published source or docs first — WebFetch on
`unpkg.com/<pkg>@<version>/src/...` works without installing
anything. Hedging ("from knowledge, not verified") is **not**
an acceptable substitute.

**Why:** during a `withSelection()` grill, an unverified claim
about TanStack's `enableMultiRowSelection` was given with a
confidence caveat; the user rejected the caveat itself — the
answer must come from source, always. Installing the package
is not required, and would violate
[[never-run-build-serve-test-unprompted]] anyway.

**How to apply:** before asserting any library API detail,
WebFetch the published package source — pin an exact version,
not a `main`/`next` branch, per
[[weight-stated-requirements-over-stability]] — and quote what
it actually says. Cite the URL.

## In-repo ADRs

Before stating what a proposed-but-unshipped design (an ADR
with `Status: proposed`) implies for current work, read the
ADR's **Decision** and **Alternatives considered** sections in
full. Do not infer intent from its Context section or a
summary table.

**Why:** while speccing an issue, I argued from an ADR's
Context table ("panel needs no row synthesis") that the panel
feature would never prune rows, and recommended a single-claim
engine slot on that basis. That ADR's Decision 5 says the
opposite — group collapse delegates to the panel feature, so
it *is* a prune contributor — and its Alternatives table had
already rejected the shared open-id source I proposed. Two
rounds of user pushback before I actually opened the file.

**How to apply:** an ADR's Context describes the problem; only
Decision and Alternatives record what was settled. Read those
two before forming a recommendation — not after being
challenged. Also: the user's pushback on a design call is
usually load-bearing knowledge, not a request to re-explain —
check the artifact they're pointing at.
