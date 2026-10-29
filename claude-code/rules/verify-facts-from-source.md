# Verify a fact by opening the artifact, not from memory

Same failure in two places: asserting what something says without
reading it. Third-party APIs and in-repo design docs.

## Third-party library APIs

Never answer a factual question about a library's API (option names,
method semantics, state shape) from the knowledge base. Fetch the
published source or docs first — WebFetch on
`unpkg.com/<pkg>@<version>/src/...` works without installing.
Hedging ("from knowledge, not verified") is **not** a substitute.

**Why:** an unverified claim about TanStack's
`enableMultiRowSelection` was given with a caveat; the user rejected
the caveat itself — the answer must come from source. Installing is
not required and would violate [[never-run-build-serve-test-unprompted]].

**How to apply:** before asserting a library API detail, WebFetch the
published source — pin an exact version, not `main`/`next`, per
[[weight-stated-requirements-over-stability]] — quote what it says,
and cite the URL.

## In-repo ADRs

Before stating what a proposed-but-unshipped design (an ADR with
`Status: proposed`) implies for current work, read its **Decision**
and **Alternatives considered** in full. Don't infer intent from
Context or a summary table.

**Why:** I argued from an ADR's Context table that a panel feature
would never prune rows; its Decision 5 said the opposite and its
Alternatives had already rejected my proposal. Two rounds of pushback
before I opened the file.

**How to apply:** Context describes the problem; only Decision and
Alternatives record what was settled — read those before forming a
recommendation. User pushback on a design call is usually
load-bearing knowledge; check the artifact they point at.
