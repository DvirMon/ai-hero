# Binary branch → boolean flag, not a string union

For a configuration option that branches between exactly two
behaviors, default to a well-named boolean rather than a
string-literal type union.

```ts
// not this, for a two-way branch
function selectAllIds<TRow>(
  table: Table<TRow>,
  scope: 'visible' | 'all',
): RowId[]

// this
function selectAllIds<TRow>(
  table: Table<TRow>,
  opts?: { includeHidden?: boolean },
): RowId[]
```

**Why:** stated directly while designing a `selectAllIds()`
helper — "whenever I have different branching, I more prefer
to use Boolean configuration than storing type
configuration... it feels more [like good] DX."

**How to apply:**
- Reserve this for genuinely **binary** branches. A 3+-way
  branch (`'left' | 'center' | 'right'`) is not this case —
  string unions stay correct there.
- Name the boolean for the deviation from default behavior,
  per [[declarative-naming]] — `includeHidden`, not
  `scope`/`mode`/`type`. It should read as what turning it
  *on* does, not as a raw state label.
