# Component Boundaries

Splitting components is a judgment call, not a rule of thumb about line count. A 200-line component that does one cohesive thing can be fine; a 30-line component juggling three unrelated concerns should be split. Use the signals below to decide, not a size threshold.

## Signal: Too Many Responsibilities

If a component's name needs "and" to describe it, or you can't summarize what it does in one short sentence, it's doing too much. A common tell: a component that fetches data, transforms it, and renders three different visual sections is really three components wearing one trenchcoat.

```tsx
// Before: one component owns fetching, filtering, AND three unrelated UI sections
function Dashboard() {
  const { data } = useQuery(...);
  const [filter, setFilter] = useState('');
  const filtered = data?.filter((d) => d.name.includes(filter));
  return (
    <div>
      <SearchInput value={filter} onChange={setFilter} />
      <SummaryStats data={filtered} />
      <ActivityChart data={filtered} />
      <RecentList data={filtered} />
    </div>
  );
}

// After: Dashboard composes; each section owns its own concern
function Dashboard() {
  const [filter, setFilter] = useState('');
  const { data } = useFilteredActivity(filter);
  return (
    <div>
      <SearchInput value={filter} onChange={setFilter} />
      <SummaryStats data={data} />
      <ActivityChart data={data} />
      <RecentList data={data} />
    </div>
  );
}
```

- Split along "what changes together" — if `ActivityChart`'s internals never need to change when `RecentList`'s do, they don't belong in the same function.
- A component that mixes data-fetching logic with heavy presentational markup is a split candidate even if it's short: extract a hook for the data, keep the component about rendering.

## Signal: Prop-Drilling Depth

Passing a prop through 2 levels to reach the component that uses it is normal. Passing it through 4+ levels, where each intermediate component only forwards it and never touches it, is a signal — but the fix is not always "split the component," it's often "stop drilling."

```tsx
// Symptom: Layout and Header never use `user`, they just relay it
<Layout user={user}>
  <Header user={user}>
    <UserMenu user={user} />
  </Header>
</Layout>
```

- If the intermediate components are otherwise cohesive, prefer `children` composition or context over splitting them further — drilling is a data-flow problem, not necessarily a component-size problem.
- If the drilling exists *because* one large component tree is artificially flattened (everything crammed into one file passing local variables as "props" to inline sub-renders), that's the split signal: break it into components that each own their own state/context access.

## Signal: Reuse Need

The clearest, least subjective signal: the same markup/logic is about to be written a second time. Extract on the second occurrence, not preemptively on the first — premature extraction guesses at an API before you know what varies between usages.

```tsx
// Second usage appears -> extract now, informed by both call sites
function PriceTag({ amount, currency = 'USD' }: { amount: number; currency?: string }) {
  return <span className="price">{formatCurrency(amount, currency)}</span>;
}
```

- Reuse across *features* (e.g. a `Button` used in both `checkout` and `settings`) belongs in `shared/`, per Feature-Sliced Design — see [architecture.md](architecture.md).
- Reuse within a single feature can stay local to that feature's `ui/` folder; don't promote it to `shared/` until a second feature actually needs it.

## Signal: Testability

If testing a piece of behavior requires rendering a large tree, mocking unrelated dependencies, and reaching deep into the DOM to assert on it, that behavior is a candidate for its own component or hook. A component boundary that lines up with a testable unit of behavior is usually also the right boundary architecturally.

```tsx
// Hard to test in isolation: validation logic is buried inside a big form component
// Easy to test: extracted into its own hook with a narrow, mockable surface
function useEmailValidation(email: string) {
  return useMemo(() => validateEmail(email), [email]);
}
```

- If you find yourself reaching for `data-testid` soup and deep queries just to verify one rule, that's a sign the rule should be extracted (usually into a hook or a small pure function) rather than tested through the parent.
- Prefer testing extracted logic directly (unit test the hook/function) over testing it indirectly through a large component's rendered output — see [testing-fundamentals.md](testing-fundamentals.md).

## When *Not* to Split

- Don't split purely to reduce line count — a long but linear, single-purpose component (e.g. a form with many fields, all part of one cohesive submission) is fine as-is.
- Don't extract a one-off snippet into a component "for reuse" before a second call site exists — see the reuse signal above.
- Don't split state and its only consumer into separate components just to shorten the parent — colocate state with the component that owns it (see [state-overview.md](state-overview.md)).
