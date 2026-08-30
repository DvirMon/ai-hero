# Extract reusable/lifecycle inline logic into named helpers during generation

When generating hooks, components, or similar logic-bearing code, pull reusable or
lifecycle-owning inline logic into named helper functions/hooks by default — reason about
function-level single-responsibility during generation itself, not just file-level splitting.

**Why:** user corrected generated code twice in one session for leaving SRP-scoped pieces inline
(an inline `.map()` object-builder, an inline `useRef` + timer lifecycle) instead of extracting
them into their own named function/hook.

**How to apply:** While writing new logic-bearing code, ask whether a given inline block is (a)
reusable elsewhere, or (b) owns a distinct lifecycle/responsibility (a timer, a subscription, a
transform pipeline) — if either, give it a name and pull it out as you write it, don't wait for a
later refactor pass. File-splitting alone (one file per component) is not sufficient — the
distinction is at function granularity.
