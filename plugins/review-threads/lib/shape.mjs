import path from 'node:path';
import { matchAny, normPath } from './glob.mjs';

// Mechanical diff-shape checks per category (D3). Pure: take old/new file text.
// Anything the lexer cannot handle (unknown extension) fails closed -> gated.

const JS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);
const CLIKE = new Set(['.java', '.cs', '.go', '.c', '.h', '.cpp', '.hpp', '.css', '.scss', '.less']);
const HASH = new Set(['.py', '.rb', '.sh', '.yml', '.yaml', '.toml']);
const PROSE = new Set(['.md', '.mdx', '.txt', '.rst']);
const ext = (f) => path.extname(f).toLowerCase();

function family(file) {
  const e = ext(file);
  if (JS.has(e)) return { line: '//', block: ['/*', '*/'], quotes: '\'"', template: true };
  if (CLIKE.has(e)) return { line: e.endsWith('css') || e === '.less' ? null : '//', block: ['/*', '*/'], quotes: '\'"', template: false };
  if (HASH.has(e)) return { line: '#', block: null, quotes: '\'"', template: false, triple: e === '.py' };
  return null;
}

const IDENT = /[A-Za-z0-9_$]/;

// Tokens of the code with comments dropped and string contents replaced by "S".
// keepStrings=true keeps string text (used by the import check).
export function lex(src, fam) {
  const toks = [];
  const stack = [{ type: 'code', depth: 0 }];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const top = stack[stack.length - 1];
    const c = src[i];
    if (top.type === 'tpl') {
      if (c === '\\') i += 2;
      else if (c === '$' && src[i + 1] === '{') {
        toks.push('S', '${');
        stack.push({ type: 'code', depth: 0, inTpl: true });
        i += 2;
      } else if (c === '`') {
        toks.push('S');
        stack.pop();
        i++;
      } else i++;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (fam.block && src.startsWith(fam.block[0], i)) {
      const e = src.indexOf(fam.block[1], i + fam.block[0].length);
      i = e < 0 ? n : e + fam.block[1].length;
      continue;
    }
    if (fam.line && src.startsWith(fam.line, i)) {
      const e = src.indexOf('\n', i);
      i = e < 0 ? n : e + 1;
      continue;
    }
    if (fam.triple && (src.startsWith('"""', i) || src.startsWith("'''", i))) {
      const q = src.slice(i, i + 3);
      const e = src.indexOf(q, i + 3);
      toks.push('S');
      i = e < 0 ? n : e + 3;
      continue;
    }
    if (fam.quotes.includes(c)) {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      toks.push('S');
      i = j + 1;
      continue;
    }
    if (fam.template && c === '`') {
      stack.push({ type: 'tpl' });
      i++;
      continue;
    }
    if (top.inTpl && c === '}' && top.depth === 0) {
      toks.push('}');
      stack.pop();
      i++;
      continue;
    }
    if (IDENT.test(c)) {
      let j = i + 1;
      while (j < n && IDENT.test(src[j])) j++;
      toks.push(src.slice(i, j));
      i = j;
      continue;
    }
    if (c === '{') top.depth++;
    if (c === '}') top.depth--;
    toks.push(c);
    i++;
  }
  return toks;
}

const same = (a, b) => a.length === b.length && a.every((t, i) => t === b[i]);
const fail = (reason) => ({ ok: false, reason });
const ok = () => ({ ok: true });

export function checkTypo(file, oldSrc, newSrc) {
  if (oldSrc === newSrc) return fail('no change');
  if (PROSE.has(ext(file))) return ok();
  const fam = family(file);
  if (!fam) return fail(`typo: unsupported file type ${ext(file) || file}`);
  return same(lex(oldSrc, fam), lex(newSrc, fam)) ? ok() : fail('typo: code tokens changed outside comments/strings');
}

// ---- unused-import (JS family only) ----
const IMPORT_RE = /^[ \t]*import\s+(type\s+)?([\w$*\s,{}]+?)\s+from\s+(['"])([^'"]+)\3[ \t]*;?[ \t]*$/gm;

function parseImports(src) {
  const items = [];
  for (const m of src.matchAll(IMPORT_RE)) {
    const clause = m[2];
    const names = new Set();
    const brace = clause.match(/\{([^}]*)\}/);
    if (brace)
      for (const part of brace[1].split(',')) {
        const p = part.trim().replace(/^type\s+/, '');
        if (!p) continue;
        const local = p.split(/\s+as\s+/).pop().trim();
        names.add(local);
      }
    const rest = clause.replace(/\{[^}]*\}/, '');
    const ns = rest.match(/\*\s*as\s+([\w$]+)/);
    if (ns) names.add(ns[1]);
    const def = rest.replace(/\*\s*as\s+[\w$]+/, '').replace(/,/g, ' ').trim();
    if (def) names.add(def.split(/\s+/)[0]);
    items.push({ module: m[4], typeOnly: !!m[1], names, text: m[0] });
  }
  return items;
}

const stripImports = (src) => src.replace(IMPORT_RE, '').replace(/\s+/g, ' ').trim();

export function checkUnusedImport(file, oldSrc, newSrc) {
  if (!JS.has(ext(file))) return fail('unused-import: JS/TS files only');
  const before = parseImports(oldSrc);
  const after = parseImports(newSrc);
  if (stripImports(oldSrc) !== stripImports(newSrc)) return fail('unused-import: non-import code changed');
  const pool = new Map();
  for (const b of before) pool.set(b.module, [...(pool.get(b.module) ?? []), b]);
  const removed = new Set();
  let touched = 0;
  const usedNew = new Set();
  for (const a of after) {
    const cands = pool.get(a.module) ?? [];
    const idx = cands.findIndex((b) => [...a.names].every((x) => b.names.has(x)));
    if (idx < 0) return fail(`unused-import: new or widened import from ${a.module}`);
    const b = cands.splice(idx, 1)[0];
    usedNew.add(b);
    for (const x of b.names) if (!a.names.has(x)) removed.add(x);
  }
  for (const b of before) if (!usedNew.has(b)) for (const x of b.names) removed.add(x);
  touched = removed.size;
  if (!touched) return fail('unused-import: nothing removed');
  const body = stripImports(newSrc);
  for (const name of removed)
    if (new RegExp(`(^|[^\\w$])${name.replace(/\$/g, '\\$')}([^\\w$]|$)`).test(body))
      return fail(`unused-import: ${name} is still referenced`);
  return ok();
}

// ---- naming (JS family only): rename of a non-exported symbol ----
const KEYWORDS = new Set(['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum']);
const IS_ID = /^[A-Za-z_$][\w$]*$/;
const RESERVED = new Set(['if', 'else', 'for', 'while', 'return', 'new', 'this', 'super', 'import', 'export', 'default', 'from', 'as', 'in', 'of', 'typeof', 'void', 'null', 'undefined', 'true', 'false', 'async', 'await', 'static', 'public', 'private', 'protected', 'readonly', 'extends', 'implements', 'constructor', 'get', 'set']);

function isExported(tokens, name) {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== 'export') continue;
    if (tokens[i + 1] === '{') {
      for (let j = i + 2; j < tokens.length && tokens[j] !== '}'; j++) if (tokens[j] === name) return true;
      continue;
    }
    if (tokens.slice(i + 1, i + 7).includes(name)) return true;
  }
  return false;
}

export function checkNaming(file, oldSrc, newSrc) {
  if (!JS.has(ext(file))) return fail('naming: JS/TS files only');
  const fam = family(file);
  const a = lex(oldSrc, fam);
  const b = lex(newSrc, fam);
  if (a.length !== b.length) return fail('naming: token count changed');
  let from = null;
  let to = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    from ??= a[i];
    to ??= b[i];
    if (a[i] !== from || b[i] !== to) return fail('naming: more than one rename');
  }
  if (!from) return fail('naming: no identifier change (comment/string only edits are typo)');
  if (!IS_ID.test(from) || !IS_ID.test(to) || RESERVED.has(from) || RESERVED.has(to)) return fail('naming: not a plain identifier rename');
  if (a.includes(to)) return fail(`naming: ${to} already exists in the file`);
  for (let i = 0; i < a.length; i++) if (a[i] === from && b[i] !== to) return fail('naming: partial rename');
  if (!a.some((t, i) => a[i - 1] && KEYWORDS.has(a[i - 1]) && t === from)) return fail(`naming: ${from} is not declared with const/let/var/function/class/interface/type/enum`);
  if (a.some((t, i) => t === from && a[i - 1] === '.')) return fail(`naming: ${from} is used as a member`);
  if (isExported(a, from)) return fail(`naming: ${from} is exported`);
  return ok();
}

// ---- project-rule: generic bound; the skill cannot loosen it ----
const countDiff = (o, n) => {
  const bag = new Map();
  for (const l of o.split('\n').map((x) => x.trim()).filter(Boolean)) bag.set(l, (bag.get(l) ?? 0) + 1);
  let added = 0;
  const addedLines = [];
  for (const l of n.split('\n').map((x) => x.trim()).filter(Boolean)) {
    if (bag.get(l) > 0) bag.set(l, bag.get(l) - 1);
    else {
      added++;
      addedLines.push(l);
    }
  }
  const removedLines = [...bag.entries()].flatMap(([l, c]) => Array(c).fill(l));
  return { changed: added + removedLines.length, lines: [...addedLines, ...removedLines] };
};

export function checkProjectRule(file, oldSrc, newSrc, { maxLines = 12 } = {}) {
  const { changed, lines } = countDiff(oldSrc, newSrc);
  if (!changed) return fail('no change');
  if (changed > maxLines) return fail(`project-rule: ${changed} changed lines exceeds ${maxLines}`);
  if (lines.some((l) => /\bexport\b/.test(l))) return fail('project-rule: touches an export');
  return ok();
}

// files: [{ path, old, new }] (old/new null for added/removed files).
export function checkShape(category, files, { anchor, maxLines } = {}) {
  if (!files.length) return fail('no change');
  const a = normPath(anchor);
  for (const f of files) {
    if (f.old == null || f.new == null) return fail('auto fix may not add or delete files');
    if (normPath(f.path) !== a) return fail(`auto fix touches ${f.path}, not the anchor ${anchor}`);
  }
  const [f] = files;
  switch (category) {
    case 'typo': return checkTypo(f.path, f.old, f.new);
    case 'unused-import': return checkUnusedImport(f.path, f.old, f.new);
    case 'naming': return checkNaming(f.path, f.old, f.new);
    case 'project-rule': return checkProjectRule(f.path, f.old, f.new, { maxLines });
    default: return fail(`unknown category ${category}`);
  }
}

// Protected-path check on the fixer's resulting diff (D3). `allow` = approved anchor.
export function protectedHits(paths, protectedPaths, allow = null) {
  return paths.filter((p) => matchAny(protectedPaths, p) && normPath(p) !== normPath(allow ?? ''));
}
