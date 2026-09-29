# DS code rules

Passed by `ds-review` to the plugin's `template-reviewer`,
`public-api-reviewer` and `standards-reviewer` as a `references` file.
Moved here from the retired `ds-code-reviewer` agent.

Each rule is a **conformance** finding when broken — cite this file and
the rule number. It becomes an **impact** finding only with the evidence
the review contract requires (e.g. a broken export is P1 because a
consumer import fails, not because rule 9 says so).

A `docs/decisions.md` / `docs/narrative.md` entry that explicitly
addresses a rule wins — cite the decision instead of flagging.

`{dsPublicApiBarrel}` = config `references.publicApiBarrel` in
`.claude/ds-wayfinder.config.json`; unset → search the DS root for
`index.ts` / `public-api.ts`.

## Rules

1. **Decorator** — `OnPush`; no `standalone: true`; no `NgModule`;
   selector `{prefix}-<name>`; correct `templateUrl`/`styleUrl`.
   Source: `.claude/skills/ds-discovery/references/component-class.md`
   + `component-class.angular.md`.
2. **API matches PRD** — every input/output/content slot matches
   `docs/prd.md` API Summary: names, types, defaults. No undocumented
   extras, none missing. Source: `docs/prd.md`.
3. **Host bindings** — theme element class in `host`; variant/state
   classes and ARIA attributes bound in `host`, never in the template.
   Source: `component-class.angular.md`.
4. **Type colocation** — public types defined in `.component.ts`,
   re-exported (not redefined) from `public-api.ts`; `index.ts` is a pure
   barrel. Source: `.claude/skills/ds-scaffold/references/file-structure.md`
   + `file-structure.angular.md`.
5. **Internal DS components** — every component in the PRD's Internal DS
   Components table imported by its documented path; none re-implemented.
6. **Primitive wiring** — the primitive chosen in discovery/architecture
   is the one wired; no substitution or hand-rolled behavior without a
   documented reason.
7. **File organization** — matches `srpClassification`; mixed concerns
   split per `.claude/rules/file-organization.md`.
8. **Template hygiene** — named slots use attribute selectors; no
   `protected` method called from a non-event binding to compute a
   render value (use `computed()` or `@let`); event bindings exempt.
   Source: `.claude/skills/ds-interview/references/component-api.md`
   + `component-api.angular.md`.
9. **Registration** — component exported from `{dsPublicApiBarrel}`.
