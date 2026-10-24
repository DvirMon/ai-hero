# DS styles rules

Passed by `ds-review` to the `code-review` plugin's `styles-reviewer` as
a `references` file, together with `{conventions}` and the resolved
`tokens` config.

These are the **universal** rules — true for every design system.
Framework- and DS-specific styling rules (encapsulation, escape hatches,
units) are `{conventions}` § Styling and § Review rules; check both.

Each rule is a **conformance** finding when broken — cite this file and
the rule number. Impact severity needs the review contract's evidence:
e.g. an escape hatch is P2 impact only when it can restyle consumer
markup; otherwise it is a RULE finding.

A `docs/decisions.md` / `docs/narrative.md` entry that explicitly
addresses a rule wins — cite the decision instead of flagging.

Sources: `stacks.css.skill` when set,
`ds-scaffold/references/motion.md`; `{planDir}/step-*-styles.plan.md`;
`docs/prd.md`; `docs/discovery-summary.md`.

## Rules

1. **Tokens only** — color, shadow, radius, spacing and motion come from
   tokens matching `tokens.allowed`, defined in `tokens.sources`. No raw
   hex/RGB/px-colour values in rule bodies; nothing matching
   `tokens.forbidden`. With `tokens.sources: []`, values come from the
   component's own custom properties, declared once on its root.
2. **Single styling root** — the component's root is the styling anchor;
   no wrapper element styled only for layout the root should own.
3. **Figma → token fidelity** — tokens match `docs/discovery-summary.md`
   (converted per `tokens.figmaToCss`). Spot-check.
4. **Override API bounded** — matches the styles step's token table and
   `{conventions}` § Styling's size limit; no locked token exposed; no
   documented token missing.
5. **Parent ownership** — no styling the styles step marks as owned by a
   parent component.
6. **Variant/state coverage** — every row of the PRD's Variants & States
   table has a style block.
7. **Motion** — durations/easing from `tokens.motion` (or component
   custom properties with the fallback values); a
   `prefers-reduced-motion` override; ≤ 300ms unless justified.
8. **Logical CSS** — logical properties over physical
   (`margin-inline-start`, not `margin-left`).
