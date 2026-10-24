# DS styles rules

Passed by `ds-review` to the plugin's `styles-reviewer` as a
`references` file. Moved here from the retired `ds-styles-reviewer`
agent.

Each rule is a **conformance** finding when broken — cite this file and
the rule number. Impact severity needs the review contract's evidence:
e.g. `::ng-deep` is P2 impact only when it can restyle consumer markup;
otherwise it is a RULE finding. (The old agent graded raw hex and
`::ng-deep` as CRIT unconditionally — that is exactly what the contract
replaces.)

A `docs/decisions.md` / `docs/narrative.md` entry that explicitly
addresses a rule wins — cite the decision instead of flagging.

`{dsStyleTokensPath}` = config `references.styleTokensPath` in
`.claude/ds-wayfinder.config.json`; unset → search the DS for the
role-token convention.

Sources: `.claude/skills/ds-scaffold/references/styles.md`
+ `styles.angular.md`, `motion.md`; `{planDir}/step-*-styles.plan.md`;
`docs/prd.md`; `docs/discovery-summary.md`.

## Rules

1. **Role tokens only** — color/shadow/radius via `var(--fill-*)`,
   `--content-*`, `--border-*`, `--shadow-*`, `--border-radius-*`. No raw
   hex/RGB, no palette tokens (`apa-palette.scss`). Token source:
   `{dsStyleTokensPath}/{prefix}-roles.scss`.
2. **`:host` is the styling root** — no wrapper element styled only for
   layout the host should own.
3. **No `::ng-deep`** — expose a custom property instead.
4. **`ViewEncapsulation.None` needs justification** — only for genuinely
   arbitrary projected content; fixed part-sets use directive-per-part.
   When justified, every selector scoped under a host class.
5. **Figma → token fidelity** — tokens match `docs/discovery-summary.md`
   paths (`/` → `-`). Spot-check.
6. **Override API bounded** — matches the styles step's token table;
   5–7 tokens max; no locked token exposed; no documented token missing.
7. **Parent ownership** — no styling the styles step marks as owned by a
   parent component.
8. **Variant/state coverage** — every row of the PRD's Variants & States
   table has a style block.
9. **Motion** — durations/easing from `--motion-*` tokens; a
   `prefers-reduced-motion` override; ≤ 300ms unless justified.
10. **Logical CSS** — logical properties over physical
    (`margin-inline-start`, not `margin-left`).
