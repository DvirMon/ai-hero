#!/usr/bin/env node
// Usage: apply-fix.mjs <workspace> '<fix-json>'
// Applies ONE user-approved mechanical fix and appends it to
// <workspace>/audit/applied.jsonl. Refuses when the file no longer matches
// what the fix expects (another session edited it), so nothing is clobbered.
//   {"op":"tick","file":"…","line":52,"checked":true}
//   {"op":"status","file":"…/progress.md","step":7,"status":"✅ done"}
//   {"op":"json-set","file":"…/state.json","path":"units.0.pr","value":6015}
//   {"op":"json-delete","file":"…/state.json","path":"githubIssues"}
//   {"op":"replace","file":"…","line":12,"from":"old text","to":"new text"}
//   {"op":"delete","file":"…"}          (paths relative to the repo root)
import fs from 'node:fs';
import path from 'node:path';
import { read, git, out, tables } from './lib.mjs';

const [wsArg, fixArg] = process.argv.slice(2);
const fix = JSON.parse(fixArg ?? 'null');
if (!wsArg || !fix) { console.error("usage: apply-fix.mjs <workspace> '<fix-json>'"); process.exit(2); }
const root = git(['rev-parse', '--show-toplevel'], process.cwd()) ?? process.cwd();
const ws = path.resolve(root, wsArg);
const file = path.resolve(root, fix.file);
if (!file.startsWith(ws + path.sep)) fail(`refusing: ${fix.file} is outside the workspace`);

const text = read(file);
if (text === null) fail(`missing file ${fix.file}`);
const lines = text.split('\n');
let next = null;

switch (fix.op) {
  case 'tick': {
    const l = lines[fix.line - 1] ?? '';
    if (!/^\s*[-*]\s+\[( |x|X)\]/.test(l)) fail(`line ${fix.line} is not a checkbox: ${l.slice(0, 80)}`);
    lines[fix.line - 1] = l.replace(/\[( |x|X)\]/, fix.checked ? '[x]' : '[ ]');
    next = lines.join('\n');
    break;
  }
  case 'status': {
    const t = tables(text).find((x) => /^step$/i.test(x.header[0]) && x.header.some((h) => /^status$/i.test(h)));
    const col = t?.header.findIndex((h) => /^status$/i.test(h));
    const row = t?.rows.find((r) => Number(/(\d+)/.exec(r.cells[0])?.[1]) === fix.step);
    if (!row) fail(`no progress row for step ${fix.step}`);
    const cells = row.cells.slice();
    cells[col] = fix.status;
    lines[row.line - 1] = `| ${cells.join(' | ')} |`;
    next = lines.join('\n');
    break;
  }
  case 'json-set':
  case 'json-delete': {
    const obj = JSON.parse(text);
    const keys = fix.path.split('.');
    const last = keys.pop();
    const parent = keys.reduce((o, k) => (o == null ? o : o[/^\d+$/.test(k) ? Number(k) : k]), obj);
    if (parent == null) fail(`path ${fix.path} not found`);
    if (fix.op === 'json-set') parent[last] = fix.value; else delete parent[last];
    if (path.basename(file) === 'state.json') obj.updatedAt = new Date().toISOString();
    next = JSON.stringify(obj, null, 2) + '\n';
    break;
  }
  case 'replace': {
    const l = lines[fix.line - 1] ?? '';
    if (!l.includes(fix.from)) fail(`line ${fix.line} does not contain the expected text`);
    lines[fix.line - 1] = l.replace(fix.from, fix.to);
    next = lines.join('\n');
    break;
  }
  case 'delete':
    fs.rmSync(file);
    break;
  default:
    fail(`unknown op ${fix.op}`);
}

if (next !== null) fs.writeFileSync(file, next);
fs.mkdirSync(path.join(ws, 'audit'), { recursive: true });
fs.appendFileSync(path.join(ws, 'audit', 'applied.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...fix }) + '\n');
out({ ok: true, op: fix.op, file: fix.file });

function fail(msg) { out({ ok: false, error: msg }); process.exit(1); }
