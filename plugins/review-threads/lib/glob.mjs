// Minimal glob: ** across dirs, * within a segment, ? one char, {a,b}.
// A trailing "/" means the whole directory. Matches against the full repo path.
export function globToRegExp(glob) {
  let g = glob.replace(/\\/g, '/');
  if (g.endsWith('/')) g += '**';
  let re = '';
  let brace = 0;
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if (c === '{') {
      brace++;
      re += '(?:';
    } else if (c === '}' && brace > 0) {
      brace--;
      re += ')';
    } else if (c === ',' && brace > 0) re += '|';
    else re += c.replace(/[.+^$()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export const normPath = (p) => String(p ?? '').replace(/\\/g, '/').replace(/^\.\//, '');
export const matchGlob = (glob, p) => globToRegExp(glob).test(normPath(p));
export const matchAny = (globs, p) => (globs ?? []).some((g) => matchGlob(g, p));
