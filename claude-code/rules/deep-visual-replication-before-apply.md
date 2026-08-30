# Deep visual replication before applying UI changes

When asked to "apply"/"replicate" a reference site's UI/design system into a codebase, a shallow
token pass (background color, radius, font) is not enough — do a full feature inventory before
touching CSS: side nav and any "on this page" TOC, tab controls, per-block action buttons (copy,
theme toggle, variant picker), and full-surface theme sync across every affected component, not
just the shell.

**Why:** a 1-screenshot-per-page, tokens-only pass was called out as "a very shallow replica" —
it missed a TOC, missed action-button chrome, and left child components (e.g. tables) unsynced
with a new dark theme. Root cause: a narrow token pass, correctly used earlier in the same
conversation for research/analysis, was carried over into the *apply* step where it doesn't hold
— research can stay narrow, implementation must cover every visible surface being changed.

**How to apply:**
1. Enumerate every distinct chrome element visible in reference screenshots (nav, TOC, tabs,
   buttons, code blocks, live-demo boxes) — don't stop at colors/radius/font.
2. Grep the target app for every component/file whose styling is affected by the change (not
   just the shell file) before calling a theme/style change "applied."
3. If a reference feature has no natural equivalent in the target (e.g. a TOC with no anchors to
   populate), say so explicitly and ask rather than silently omitting it — don't let a scope
   trade-off read as an oversight.
