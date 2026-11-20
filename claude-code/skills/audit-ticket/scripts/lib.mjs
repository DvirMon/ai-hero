// Shared parsers for audit-ticket scripts. No dependencies: Node 18+ only.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const STEP_STATUSES = ['⬚', '▶', '✅', '🧪', '⏭'];
export const READINESS = [
  'needs:triage', 'needs:grill', 'needs:spec', 'needs:issues',
  'needs:tasks', 'ready-for-agent', 'in-progress',
];
export const REMOVED_STATE_KEYS = [
  'githubIssues', 'checklist', 'stack', 'frontierIssue', 'issuesPath',
  'issueGraphPath', 'planPath', 'ticketSummary', 'discovery',
];
export const KEY_RE = /\b([A-Z][A-Z0-9]+-\d+)\b/g;

export function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

export function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}

export function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 1) + '\n');
}

// Minimal YAML frontmatter: scalars, inline arrays, block lists of scalars.
export function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text ?? '');
  if (!m) return null;
  const fm = {};
  let listKey = null;
  for (const raw of m[1].split('\n')) {
    const item = /^\s+-\s+(.*)$/.exec(raw);
    if (item && listKey) { fm[listKey].push(unquote(item[1])); continue; }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(raw);
    if (!kv) continue;
    const [, k, v] = kv;
    if (v === '') { fm[k] = []; listKey = k; continue; }
    listKey = null;
    if (/^\[.*\]$/.test(v)) {
      fm[k] = v.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean)
        .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
    } else fm[k] = /^\d+$/.test(v) ? Number(v) : unquote(v);
  }
  return fm;
}

function unquote(s) {
  return s.replace(/^["']|["']$/g, '');
}

// Checkboxes with their line number and the nearest `## ` section.
export function checkboxes(text) {
  const boxes = [];
  let section = null;
  (text ?? '').split('\n').forEach((line, i) => {
    const h = /^##\s+(.*)$/.exec(line);
    if (h) section = h[1].trim();
    const b = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(line);
    if (b) boxes.push({ line: i + 1, checked: b[1] !== ' ', section, text: b[2].slice(0, 160) });
  });
  return boxes;
}

// Every Markdown table as { header, rows: [{ line, cells }] }.
export function tables(text) {
  const result = [];
  const lines = (text ?? '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^\|/.test(lines[i]) || !/^\|[\s:|-]+\|$/.test(lines[i + 1] ?? '')) continue;
    const header = cells(lines[i]);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && /^\|/.test(lines[j]); j++) rows.push({ line: j + 1, cells: cells(lines[j]) });
    result.push({ line: i + 1, header, rows });
    i = j;
  }
  return result;
}

function cells(line) {
  return line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

export function keysIn(text) {
  return [...new Set([...(text ?? '').matchAll(KEY_RE)].map((m) => m[1]))];
}

// `a/b.{ts,html} (new — note)` → ['a/b.ts', 'a/b.html']
export function expandFileEntry(entry) {
  const p = String(entry).split(/\s+\(|\s+—|\s+-\s/)[0].trim().replace(/`/g, '');
  const brace = /\{([^}]+)\}/.exec(p);
  if (!brace) return [p];
  return brace[1].split(',').flatMap((alt) => expandFileEntry(p.replace(brace[0], alt.trim())));
}

export function globToRe(p) {
  const esc = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§').replace(/\*/g, '[^/]*').replace(/§/g, '.*');
  return new RegExp(`(^|/)${esc}$`);
}

export function listFiles(dir, rel = '') {
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
  return entries.flatMap((e) => {
    const r = path.join(rel, e.name);
    return e.isDirectory() ? listFiles(path.join(dir, e.name), r) : [r];
  });
}
