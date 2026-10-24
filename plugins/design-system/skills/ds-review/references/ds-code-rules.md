# DS code rules

Passed by `ds-review` to the `code-review` plugin's `template-reviewer`,
`public-api-reviewer` and `standards-reviewer` as a `references` file,
together with `{conventions}`.

These are the **universal** rules — true for every design system. The
rules specific to this design system are `{conventions}` § Review rules;
check both.

Each rule is a **conformance** finding when broken — cite this file (or
`{conventions} § Review rules #N`) and the rule number. It becomes an
**impact** finding only with the evidence the review contract requires
(e.g. a broken export is P1 because a consumer import fails, not because
a rule says so).

A `docs/decisions.md` / `docs/narrative.md` entry that explicitly
addresses a rule wins — cite the decision instead of flagging.

## Rules

1. **API matches PRD** — every input/output/content slot matches
   `docs/prd.md` API Summary: names, types, defaults. No undocumented
   extras, none missing.
2. **Building blocks reused** — every component in the PRD's Internal DS
   Components table is imported by its documented path; none
   re-implemented.
3. **Primitive wiring** — the primitive chosen in discovery/architecture
   is the one wired; no substitution or hand-rolled behavior without a
   documented reason.
4. **File organization** — matches `srpClassification` and
   `{conventions}` § File layout; mixed concerns split one per file.
5. **Composability** — content that could hold rich markup is projected,
   not a string input (`ds-interview/references/component-api.md`).
6. **Conventions** — every rule in `{conventions}` § Review rules.
