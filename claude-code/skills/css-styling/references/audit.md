# SCSS/CSS Audit Rules

Apply these constraints whenever reviewing or modifying stylesheets:

1. **Check compiled size vs the project's build budget** (if one is configured, e.g. an Nx/webpack per-file CSS budget). Report current size vs budget after each change.
2. **Design tokens only for dynamic/reused values** — only convert a hardcoded value to a token if it's dynamic (theme-dependent) or appears **3+ times** in the file. Don't tokenize one-off values.
3. **Prefer small, targeted changes** — make the minimum change needed. Avoid broad refactors.
4. **Report size after changes.**

```bash
# Check compiled stylesheet size
wc -c < path/to/component.scss
```
