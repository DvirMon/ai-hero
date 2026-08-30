# Design Tokens

## Resolving Token Names (do this first, per project)

Token names are project-specific — never assume a name from a prior project applies here.

1. **Look for an existing token/theme file first** — grep the project for its design-token source (a `*-tokens.scss`, `*-roles.scss`, `theme.css`, `variables.scss`, Tailwind theme config, or similar). Use whatever role/scale naming that file already establishes.
2. **No established token vocabulary found?** Default to **Angular Material 3 system-token semantics** as the fallback role vocabulary, even in non-Material projects — it gives a consistent, well-documented role-based naming scheme to anchor new tokens on:
   - `--mat-sys-primary`, `--mat-sys-on-primary`
   - `--mat-sys-secondary`, `--mat-sys-on-secondary`
   - `--mat-sys-surface`, `--mat-sys-surface-variant`, `--mat-sys-on-surface`
   - `--mat-sys-outline`, `--mat-sys-outline-variant`
   - `--mat-sys-error`, `--mat-sys-on-error`
3. Every code example below uses **illustrative placeholder names** (`--role-token-name`, etc.) — substitute the project's real tokens (or the Material fallback), don't copy the placeholder literally.

## Colors

```css
/* BAD: Hardcoded colors */
.button {
  background: #1F2E40;
  color: #FFFFFF;
}

/* GOOD: resolved project/Material token */
.button {
  background: var(--role-token-fill);   /* e.g. --mat-sys-primary if no project token exists */
  color: var(--role-token-content);     /* e.g. --mat-sys-on-primary */
}
```

## Font Sizes

```css
/* BAD: Hardcoded sizes */
.title {
  font-size: 24px;
}

/* GOOD: token-driven */
.title {
  font-size: var(--role-token-font-size-heading);
}
```

## Border Radius

```css
/* BAD: Hardcoded radius */
.card {
  border-radius: 8px;
}

/* GOOD: token-driven */
.card {
  border-radius: var(--role-token-radius-md);
}
```

## Finding a project's tokens

Search the project for its token/theme source before writing any new value — do not guess a naming scheme. Typical locations: a `styles/` or `theme/` directory, a `*-tokens.scss`/`*-roles.scss` file, or the Tailwind theme config.
