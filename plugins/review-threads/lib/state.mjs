import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, readdirSync, statSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { git } from './exec.mjs';
import { globToRegExp } from './glob.mjs';

export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

// Write-then-rename so a crash never leaves half a file.
export function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(tmp, file);
}

const REVIEW = 'review.json';
const THREADS = 'threads.json';

export const loadReview = (dir) => (existsSync(path.join(dir, REVIEW)) ? readJson(path.join(dir, REVIEW)) : null);
export const saveReview = (dir, data) => writeJson(path.join(dir, REVIEW), data);
export const loadThreads = (dir) => readJson(path.join(dir, THREADS));
export const saveThreads = (dir, data) => writeJson(path.join(dir, THREADS), data);

// Read-modify-write one thread record (written before every side effect).
export function updateThread(dir, id, patch) {
  const review = loadReview(dir);
  if (!review?.threads?.[id]) throw new Error(`unknown thread ${id}`);
  review.threads[id] = { ...review.threads[id], ...patch };
  saveReview(dir, review);
  return review.threads[id];
}

// {issue} comes from "Closes #N" in the PR body, else digits in the branch name.
export function parseIssue(body, branch) {
  const m = String(body ?? '').match(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i);
  if (m) return m[1];
  const b = String(branch ?? '').match(/(?:^|[/_-])(\d+)(?=[/_-]|$)/);
  return b ? b[1] : null;
}

function expandWildcards(root, rel) {
  let bases = [root];
  for (const seg of rel.split('/').filter(Boolean)) {
    const next = [];
    for (const b of bases) {
      if (!seg.includes('*')) {
        next.push(path.join(b, seg));
        continue;
      }
      if (!existsSync(b)) continue;
      const re = globToRegExp(seg);
      for (const name of readdirSync(b)) if (re.test(name)) next.push(path.join(b, name));
    }
    bases = next;
  }
  return bases.filter((p) => existsSync(p) && statSync(p).isDirectory());
}

const sanitize = (s) => String(s).replace(/[^\w.-]+/g, '_');

// D14. Returns { dir, source } or { choose: [dirs] } when the template is ambiguous.
export function resolveStateDir({ template, vars, repoRoot, pluginData, host, project, pr }) {
  const fallback = path.join(
    pluginData || path.join(os.homedir(), '.claude', 'plugins', 'data', 'review-threads'),
    sanitize(host),
    ...project.split('/').map(sanitize),
    String(pr),
  );
  if (!template) return { dir: fallback, source: 'fallback' };
  if (/\{issue\}/.test(template) && !vars.issue) return { dir: fallback, source: 'fallback' };
  const rel = template.replace(/\{(branch|pr|issue)\}/g, (_, k) => sanitize(vars[k] ?? ''));
  const matches = expandWildcards(repoRoot, rel);
  if (matches.length === 1) return { dir: matches[0], source: 'template' };
  if (matches.length > 1) return { choose: matches };
  return { dir: fallback, source: 'fallback' };
}

// Keep a state dir that lives inside the checkout out of git (D14).
export function excludeFromGit(repoRoot, dir) {
  const rel = path.relative(repoRoot, dir).replace(/\\/g, '/');
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
  const file = path.resolve(repoRoot, git(['rev-parse', '--git-path', 'info/exclude'], { cwd: repoRoot }).trim());
  mkdirSync(path.dirname(file), { recursive: true });
  const line = `/${rel}/`;
  const cur = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (cur.split(/\r?\n/).includes(line)) return false;
  appendFileSync(file, `${cur && !cur.endsWith('\n') ? '\n' : ''}${line}\n`);
  return true;
}
