# PRD

`prd.md` — at the `docs.prd` path from [`workflow-config.md`](workflow-config.md): next to the
component for a library / design system, in the feature's domain folder for an app. Every PRD
file is named `prd.md`.

One contract, two variants. Both share the core, so `/to-spec` reads either one way.

| Variant | Written by | Read by |
|---|---|---|
| capability (library / DS) | `story:discovery` | `story:plan`, `/to-spec` |
| feature (app) | `/to-ticket` | `grill-with-docs`, `/to-spec` |

## Shared core

    # <Capability or feature>
    ## Problem        <2-4 sentences: what hurts today>
    ## Who            <the people it is for, one line each>
    ## User stories   <variant-specific shape, below>
    ## Out of scope   <one bullet each>

## Capability variant

`story:plan` re-derives every coverage mark against real story code. The frozen rows are its
interface — a trim that touches them breaks the tool. Here the user stories are the `# 1..k`
sections themselves, not nested under a `## User stories` heading.

    # 1..k  <One heading per thing a person is trying to do>
    ## n.m — <Story title> — <✅|🟡|❌> <one-clause state>        FROZEN
    > As someone <situation>, I want <action>, so that <outcome>.  FROZEN
    **Acceptance criteria**  <bullets>                              FROZEN
    **Failure behavior**     <bullets>                              FROZEN
    **Covered by:** <story links, one clause each>                  FROZEN
    **Design status:** <one line, or a link to the research that owns the citation>

    # Community pain               <what people report, linked to the research>
    # Competitors                  <what a person can do there, linked to the research>
    # Cross-feature interactions   <one ## per owning feature, each linking not restating>
    # Open questions               <one bullet each: question, recommendation, what settles it>
    # Gap analysis, by owning layer
    # Capabilities with no owner
    # Not user-facing

Link the coverage-mark legend; do not restate it.

## Feature variant

    ## User stories
    > As someone <situation>, I want <action>, so that <outcome>.
    **Acceptance criteria**  <bullets, each with a source tag>

    ## Current flow     <steps a person takes today>
    ## Target flow      <steps after the change>
    ## Success signal   <what shows it worked, measurable when possible>

The tracker ticket stays a short summary that links this file.

## Source tags

Every requirement line (acceptance criterion, failure-behavior bullet) ends with its source:

| Source | Tag | Added by |
|---|---|---|
| remote ticket AC | `[PROJ-123 · MM-DD]` — ticket key, pull date | `/to-ticket` copies them (feature variant only) |
| grill decision | `[Dn]` — entry in the ticket's `1-decisions.md` | `grill-with-docs` |

A line with neither source (discovery-derived, in a capability PRD) takes no tag; its evidence
is linked from **Design status**.

A capability PRD carries no ticket ACs. One capability spans many tickets, so a library or DS
ticket's ACs stay on the ticket; `/to-spec` reads them from there.

`/to-spec` re-fetches the remote ACs once. A changed AC gets its new text and pull date, and is
flagged before the checklist is built.

## Conflict marker

A grill decision that contradicts a remote AC does not overwrite it. The decision is logged as
proposed, and the AC line gets `⚠ Dn` after its tag:

    - Export is limited to visible rows [PROJ-123 · 10-23] ⚠ D7

Product owns the AC. `/to-spec` stops while any `⚠` is open. It clears one of two ways:

- **Product updates the ticket:** the re-fetched line replaces it with a new pull date, the
  marker is dropped, and `Dn` is marked accepted or rejected to match.
- **The user overrides:** the override is its own entry `Dm`. The line is rewritten to the
  decision and tagged `[Dm]`; the marker is dropped.

**Capability PRD:** there is no AC line to mark. The proposed entry in `1-decisions.md` carries
`⚠ <KEY> AC` instead, and clears the same two ways.

## Rules

- **Covered by** names the story and what to do in it. It does not explain the mechanism.
- **Design status** is one line. Competitor-issue citations, peer comparisons and
  "no decision covers this" arguments live in `work/**/research-*.md` and are linked.
- The coverage-mark legend, ownership note and layer-free disclaimer exist once, in
  `README.md` or one owning doc. The others link.
- A resolved item is deleted, not struck through. History is in git and `work/`.
- No re-verification narration ("re-verified 2026-09-05, was wrongly marked ❌"). The mark
  is the current state; the delta is a commit message.
- No process sections (`# Report the deltas`). Those are the run's output, not the doc.
