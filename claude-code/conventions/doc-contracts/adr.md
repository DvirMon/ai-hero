# ADR

`docs/adr/NNNN-slug.md`, numbered sequentially — scan for the highest and add one. Create
`docs/adr/` lazily, on the first ADR.

## Shape

    # <Short title of the decision>

    <1-3 sentences: the context, what was decided, and why.>

That is a complete ADR. Its value is recording *that* a decision was made and *why* — not
filling sections.

## Optional sections — each earns its place or is absent

- **Status** frontmatter (`proposed | accepted | deprecated | superseded by ADR-NNNN`) —
  only once a decision has been revisited.
- **Alternatives considered** — only when a rejected option is likely to be proposed again.
  One line per alternative: what it was, why not.
- **Consequences** — only for downstream effects a reader would not infer from the decision.

Budget: under 40 lines including every optional section. Most ADRs are under 10.

## Never in an ADR

Research, option-weighing narrative, objections and rebuttals, open questions, type-probe
transcripts, pasted source, corrections to an earlier draft of the same ADR. Research belongs
in `work/`; open questions in `decisions.md`; a changed decision is a *new* ADR that
supersedes this one.

## When to write one

All three, or skip it: hard to reverse; surprising without context; the result of a real
trade-off. Deliberate deviations from the obvious path qualify. "We did the obvious thing"
does not.
