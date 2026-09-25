# Contract Testing — Placeholder

> Populate when first contract test is written. See `testing-principles.md` for shared rules.

## Scope

Verify fake server/database contracts match real ones. Run same test suite against real and fake — divergence = contract violation.

## Tools

- MSW (Mock Service Worker) for HTTP fakes
- DI-injected service fakes (Angular)
- Faker for seed data generation

## TODO

- [ ] Define contract test structure (dual-run pattern)
- [ ] MSW handler organization conventions
- [ ] Fake data seeding patterns
- [ ] CI integration (when to run against real vs fake)
