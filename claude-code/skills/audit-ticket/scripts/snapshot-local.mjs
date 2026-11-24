#!/usr/bin/env node
// Usage: snapshot-local.mjs <ticket-key | slug | workspace-path> [--repo <root>] [--write]
// --write: save to <workspace>/audit/snapshot.json and print only its path + counts.
// Prints the local tracking facts of one ticket workspace as JSON, plus
// deterministic checks against the D6 layout (references/layout.md).
import fs from 'node:fs';
import path from 'node:path';
import {
  read, git, out, frontmatter, checkboxes, tables, keysIn, listFiles,
  STEP_STATUSES, READINESS, REMOVED_STATE_KEYS,
} from './lib.mjs';

const args = process.argv.slice(2);
const target = args[0];
const repoRoot = args.includes('--repo') ? args[args.indexOf('--repo') + 1] : git(['rev-parse', '--show-toplevel'], process.cwd()) ?? process.cwd();
if (!target) { console.error('usage: snapshot-local.mjs <key|slug|path>'); process.exit(2); }

const ws = resolveWorkspace(target);
if (!ws) { out({ error: `no workspace found for ${target}`, searched: `${repoRoot}/**/docs/work/` }); process.exit(1); }

const checks = [];
const check = (id, severity, msg, file, line) => checks.push({ id, severity, msg, file: file && path.relative(repoRoot, file), line });

const ROOT_ALLOWED = /^(state\.json|prd\.md|index\.md|decisions\.md|spec\.md|3-architecture\.md|design\.md|issue-graph\.md|discovery\/[\w.-]+\.md|e2e-[A-Z][A-Z0-9]+-\d+\/.+|audit\/.+)$/;
const TASK_ALLOWED = /^tasks\/(issue-[^/]+\/)?(step-\d+-[\w.-]+\.(plan|test-plan)\.md|progress\.md|review\.md)$/;
const ASSET = /\.(png|jpe?g|gif|svg|webp|html)$/i;

// Epic layout (D18): slice folders t<N>-<slug>/ with their own state.json are
// accepted. Root-level run: files under a slice folder are audited when the
// slice is run as its own workspace. Slice-level run: tasks/ has no issue-<N>/
// level, and prd.md / decisions.md are inherited from the epic root.
const SLICE_DIR = /^t\d+-[^/]+$/;
const isSlice = SLICE_DIR.test(path.basename(ws)) && fs.existsSync(path.join(path.dirname(ws), 'state.json'));
const SLICE_TASK_ALLOWED = /^tasks\/(step-\d+-[\w.-]+\.(plan|test-plan)\.md|progress\.md|review\.md)$/;
const taskAllowed = (f) => TASK_ALLOWED.test(f) || (isSlice && SLICE_TASK_ALLOWED.test(f));
const allFiles = listFiles(ws).filter((f) => !f.split(path.sep).some((s) => s.startsWith('.')));
const epicSlices = [...new Set(allFiles.filter((f) => f.endsWith('/state.json') && f.split('/').length === 2 && SLICE_DIR.test(f.split('/')[0])).map((f) => f.split('/')[0]))];
const files = allFiles.filter((f) => !epicSlices.some((d) => f.startsWith(`${d}/`)));
const offLayout = files.filter((f) => !ASSET.test(f) && !ROOT_ALLOWED.test(f) && !taskAllowed(f.split(path.sep).join('/')));
const subWorkspaces = files.filter((f) => f.endsWith('state.json') && f !== 'state.json').map((f) => path.dirname(f));
offLayout.forEach((f) => check('layout.off', 'migrate', `not in the D6 file set: ${f}`, path.join(ws, f)));
subWorkspaces.forEach((d) => check('layout.sub-workspace', 'migrate', `nested workspace ${d}/ (own state.json)`, path.join(ws, d, 'state.json')));

// state.json
const stateFile = path.join(ws, 'state.json');
const stateText = read(stateFile);
let state = null;
if (!stateText) check('state.missing', 'migrate', 'no state.json', stateFile);
else {
  try { state = JSON.parse(stateText); } catch (e) { check('state.parse', 'error', `state.json does not parse: ${e.message}`, stateFile); }
}
if (state) {
  if (!(state.schemaVersion >= 5)) check('state.version', 'migrate', `schemaVersion ${state.schemaVersion ?? 'missing'} < 5`, stateFile);
  REMOVED_STATE_KEYS.filter((k) => k in state).forEach((k) => check('state.removed-key', 'migrate', `removed key "${k}"`, stateFile));
  if (!Array.isArray(state.units)) check('state.units', 'migrate', 'no units[]', stateFile);
  for (const [k, v] of Object.entries(state)) {
    if (/Path$/.test(k) && typeof v === 'string' && !fs.existsSync(path.resolve(repoRoot, v)) && !fs.existsSync(path.resolve(ws, v)))
      check('state.path', 'fix', `${k} points at a missing file: ${v}`, stateFile);
  }
  (state.units ?? []).forEach((u, i) => {
    if (u.readiness && !READINESS.includes(u.readiness)) check('state.readiness', 'fix', `units[${i}].readiness "${u.readiness}" is not a ladder rung`, stateFile);
    if (u.branch && !git(['branch', '--list', u.branch], repoRoot)) check('state.branch', 'fix', `units[${i}].branch ${u.branch} does not exist`, stateFile);
    if (u.worktree && !fs.existsSync(u.worktree)) check('state.worktree', 'fix', `units[${i}].worktree ${u.worktree} does not exist`, stateFile);
    if (u.branch && !u.pr) check('state.pr', 'info', `units[${i}] has no pr; look it up for ${u.branch}`, stateFile);
  });
  const newest = Math.max(...files.map((f) => fs.statSync(path.join(ws, f)).mtimeMs));
  if (state.updatedAt && Date.parse(state.updatedAt) < newest - 864e5) check('state.updatedAt', 'info', `updatedAt ${state.updatedAt} is older than the newest workspace file`, stateFile);
}

// steps + progress
const taskDirs = [...new Set(files.filter((f) => taskAllowed(f.split(path.sep).join('/'))).map((f) => path.dirname(f)))];
const issues = taskDirs.map((dir) => {
  const abs = path.join(ws, dir);
  const progressFile = path.join(abs, 'progress.md');
  const progressText = read(progressFile);
  const tbls = tables(progressText);
  const stepTable = tbls.find((t) => /^step$/i.test(t.header[0]) && t.header.some((h) => /^status$/i.test(h)));
  const statusCol = stepTable?.header.findIndex((h) => /^status$/i.test(h));
  const depsCol = stepTable?.header.findIndex((h) => /depends/i.test(h));
  const rows = (stepTable?.rows ?? []).map((r) => {
    const n = Number(/(\d+)/.exec(r.cells[0])?.[1]);
    const status = r.cells[statusCol] ?? '';
    return { step: n, status, glyph: STEP_STATUSES.find((g) => status.startsWith(g)) ?? null, deps: depsCol >= 0 ? r.cells[depsCol] : null, line: r.line };
  });
  const coverage = tbls.filter((t) => t !== stepTable && t.header.some((h) => /^step/i.test(h)))
    .flatMap((t) => t.rows.map((r) => ({ criterion: r.cells[0], step: r.cells[t.header.findIndex((h) => /^step/i.test(h))], line: r.line })));
  if (!progressText) check('progress.missing', 'migrate', `no progress.md in ${dir}`, progressFile);
  rows.filter((r) => !r.glyph).forEach((r) => check('progress.status', 'fix', `step ${r.step} status "${r.status}" is off the ladder ${STEP_STATUSES.join(' ')}`, progressFile, r.line));

  const steps = fs.readdirSync(abs).filter((f) => /^step-\d+-.*\.plan\.md$/.test(f) && !f.endsWith('.test-plan.md')).map((f) => {
    const file = path.join(abs, f);
    const text = read(file);
    const fm = frontmatter(text) ?? {};
    const n = fm.step ?? Number(/^step-(\d+)/.exec(f)[1]);
    const boxes = checkboxes(text);
    const row = rows.find((r) => r.step === n);
    const testPlan = path.join(abs, f.replace(/\.plan\.md$/, '.test-plan.md'));
    const jira = fm.jira ?? null;
    if (!row) check('progress.no-row', 'fix', `step ${n} has no progress.md row`, file);
    if (!jira) check('step.jira', 'migrate', `step ${n} has no jira: frontmatter key`, file);
    if (!fm.depends_on) check('step.depends', 'fix', `step ${n} has no depends_on frontmatter`, file);
    if (row?.deps && fm.depends_on && JSON.stringify(keysOrNums(row.deps)) !== JSON.stringify([...fm.depends_on].sort((a, b) => a - b)))
      check('step.depends-drift', 'fix', `step ${n}: progress.md depends_on ${row.deps} != frontmatter [${fm.depends_on}]`, progressFile, row.line);
    const open = boxes.filter((b) => !b.checked);
    if (row?.glyph === '✅' && open.length) check('step.box-open-on-done', 'fix', `step ${n} is ✅ but has ${open.length} open box(es)`, file, open[0].line);
    if (row && row.glyph !== '✅' && row.glyph !== '⏭' && boxes.length && !open.length) check('step.boxes-done-not-done', 'fix', `step ${n} boxes all ticked but status ${row.status}`, progressFile, row.line);
    return {
      step: n, file: path.relative(repoRoot, file), type: fm.type ?? null, jira, keys: keysIn(`${fm.commit_message ?? ''} ${text.split('\n')[0]}`),
      commit_message: fm.commit_message ?? null, depends_on: fm.depends_on ?? null, files: fm.files ?? [],
      status: row?.status ?? null, glyph: row?.glyph ?? null, boxes,
      testPlan: fs.existsSync(testPlan) ? path.relative(repoRoot, testPlan) : null,
    };
  }).sort((a, b) => a.step - b.step);
  // A slice may track steps only in its progress table (no step files): accepted (D18).
  if (!(isSlice && steps.length === 0)) rows.filter((r) => !steps.some((s) => s.step === r.step)).forEach((r) => check('progress.orphan', 'fix', `progress row ${r.step} has no step file`, progressFile, r.line));
  return { dir: path.relative(repoRoot, abs), progress: progressText ? path.relative(repoRoot, progressFile) : null, rows, coverage, steps };
});

// issue-graph.md
const graphFile = path.join(ws, 'issue-graph.md');
const graphText = read(graphFile);
const graph = graphText ? (() => {
  const t = tables(graphText)[0];
  const stateCol = t?.header.findIndex((h) => /^state$/i.test(h));
  if (stateCol >= 0) check('graph.state', 'fix', 'issue-graph.md has a State column (state belongs to the tracker)', graphFile, t.line);
  if (/frontier/i.test(graphText)) check('graph.frontier', 'fix', 'issue-graph.md names a frontier (derived state)', graphFile);
  const nodes = (t?.rows ?? []).map((r) => {
    const dep = t.header.findIndex((h) => /depends/i.test(h));
    return { key: keysIn(r.cells[0])[0] ?? r.cells[0], title: r.cells[1], dependsOn: dep >= 0 ? keysIn(r.cells[dep]) : [], line: r.line };
  });
  return { file: path.relative(repoRoot, graphFile), nodes };
})() : null;

// prd.md ACs and decisions
const prdText = read(path.join(ws, 'prd.md'));
const prd = prdText ? checkboxes(prdText).concat(
  prdText.split('\n').map((l, i) => ({ line: i + 1, text: l })).filter((l) => /\[[A-Z][A-Z0-9]+-\d+ · \d\d-\d\d\]/.test(l.text) && !/\[( |x)\]/.test(l.text)),
).map((a) => ({ line: a.line, text: a.text, tag: /\[([A-Z][A-Z0-9]+-\d+) · (\d\d-\d\d)\]/.exec(a.text)?.slice(1) ?? null })) : null;
if (!prdText && !isSlice) check('prd.missing', 'migrate', 'no prd.md (local copy of the tracker ACs)', path.join(ws, 'prd.md'));

const decisionsFile = path.join(ws, 'decisions.md');
const decText = read(decisionsFile);
if (!decText && isSlice) { /* inherited from the epic root */ }
else if (!decText) check('decisions.missing', 'migrate', 'no decisions.md', decisionsFile);
else {
  const lines = decText.split('\n');
  for (const [i, l] of lines.entries()) {
    for (const m of l.matchAll(/replaces (D\d+)/g)) {
      const target = lines.findIndex((x) => new RegExp(`\\*\\*${m[1]}\\*\\*`).test(x));
      if (target >= 0 && !/superseded/i.test(lines[target])) check('decisions.supersede', 'fix', `${m[1]} is replaced (line ${i + 1}) but not marked superseded`, decisionsFile, target + 1);
    }
  }
}

const result = {
  workspace: path.relative(repoRoot, ws), repoRoot,
  state: state && { schemaVersion: state.schemaVersion, ticketRef: state.ticketRef, units: state.units ?? null, specPath: state.specPath, prdPath: state.prdPath },
  layout: { files: files.length, offLayout, subWorkspaces, epicSlices, isSlice },
  issues, graph, prd, checks,
  counts: checks.reduce((a, c) => ({ ...a, [c.severity]: (a[c.severity] ?? 0) + 1 }), {}),
};
if (args.includes('--write')) {
  const dest = path.join(ws, 'audit', 'snapshot.json');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(result, null, 1) + '\n');
  process.stdout.write(`${path.relative(repoRoot, dest)} · ${JSON.stringify(result.counts)}\n`);
} else out(result);

function keysOrNums(s) {
  return [...String(s).matchAll(/\d+/g)].map((m) => Number(m[0])).sort((a, b) => a - b);
}

function resolveWorkspace(t) {
  if (fs.existsSync(t) && fs.statSync(t).isDirectory()) return path.resolve(t);
  const needle = t.toLowerCase();
  const hits = [];
  const walk = (dir, depth) => {
    if (depth > 6) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      if (path.basename(dir) === 'work' && path.basename(path.dirname(dir)) === 'docs' && e.name.toLowerCase().includes(needle)) hits.push(p);
      else walk(p, depth + 1);
    }
  };
  walk(repoRoot, 0);
  return hits.length === 1 ? hits[0] : hits.length > 1 ? (out({ error: 'ambiguous', hits }), process.exit(1)) : null;
}
