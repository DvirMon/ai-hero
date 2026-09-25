# Product user-stories doc

`docs/0-product/<capability>.md`. Written by `story-discovery`; read by `story-plan`, which
re-derives every coverage mark against real story code. The frozen rows below are its
interface — a trim that touches them breaks the tool.

## Shape

    # <Capability>
    <Scope: 2-4 sentences. Link the coverage-mark legend; do not restate it.>

    # 1..k  <One heading per thing a person is trying to do>
    ## n.m — <Story title> — <✅|🟡|❌> <one-clause state>        FROZEN
    > As someone <situation>, I want <action>, so that <outcome>.  FROZEN
    **Acceptance criteria**  <bullets>                              FROZEN
    **Failure behavior**     <bullets>                              FROZEN
    **Covered by:** <story links, one clause each>                  FROZEN
    **Design status:** <one line, or a link to the research that owns the citation>

    # Cross-feature interactions   <one ## per owning feature, each linking not restating>
    # Open questions               <one bullet each: question, recommendation, what settles it>
    # Gap analysis, by owning layer
    # Capabilities with no owner
    # Not user-facing

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
