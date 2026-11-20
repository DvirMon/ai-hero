#!/usr/bin/env node
// Usage: align.mjs <snapshot.json> <tracker.json>
// High-level alignment between the tracker and the local workspace (Gate 1
// and the status half of Gate 2). Pure comparison: no judgment, no writes.
// tracker.json shape: agents/ticket-tracker-snapshot.md § Output.
import { read, out } from './lib.mjs';

const [snapFile, trackerFile] = process.argv.slice(2);
const snap = JSON.parse(read(snapFile) ?? 'null');
const tr = JSON.parse(read(trackerFile) ?? 'null');
if (!snap || !tr) { console.error('usage: align.mjs <snapshot.json> <tracker.json>'); process.exit(2); }

const norm = (s) => String(s ?? '').toLowerCase().replace(/[`*_~™®]/g, '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
const findings = [];
const add = (kind, gate, key, local, remote, note) => findings.push({ kind, gate, key, local, remote, note });

const remote = new Map(tr.subtasks.map((s) => [s.key, s]));
const steps = snap.issues.flatMap((i) => i.steps);
const nodes = snap.graph?.nodes ?? [];
const localKeys = new Set([...nodes.map((n) => n.key), ...steps.map((s) => s.jira).filter(Boolean)]);
localKeys.delete(tr.ticket.key);

for (const s of tr.subtasks) {
  if (!localKeys.has(s.key)) add('unmapped-remote', 1, s.key, null, `${s.summary} (${s.status})`, 'sub-task has no local slice or step');
}
// A step's jira: key alone hides a stale issue-graph, so check the graph on its own.
const nodeKeys = new Set(nodes.map((n) => n.key));
for (const s of tr.subtasks) {
  if (localKeys.has(s.key) && !nodeKeys.has(s.key)) add('graph-missing', 1, s.key, null, s.summary, 'sub-task is mapped by a step but has no issue-graph node');
}
for (const k of localKeys) {
  if (!remote.has(k)) add('unmapped-local', 1, k, nodes.find((n) => n.key === k)?.title ?? 'step key', null, 'local key is not a sub-task of the ticket');
}
for (const n of nodes) {
  const r = remote.get(n.key);
  if (!r) continue;
  if (norm(n.title) && norm(n.title) !== norm(r.summary)) add('title', 1, n.key, n.title, r.summary, 'slice title differs (local may be more detailed: confirm scope matches)');
  const a = [...n.dependsOn].sort().join(','), b = [...(r.blockedBy ?? [])].sort().join(',');
  if (a !== b) add('edges', 1, n.key, a || '—', b || '—', 'issue-graph depends-on vs tracker Blocks links');
}

const done = (s) => s.glyph === '✅' || s.glyph === '⏭';
for (const [key, r] of remote) {
  const mine = steps.filter((s) => s.jira === key);
  if (!mine.length) continue;
  const allDone = mine.every(done);
  const rDone = r.statusCategory === 'done';
  if (allDone && !rDone) add('local-done-remote-open', 2, key, mine.map((s) => `step ${s.step} ${s.status}`).join('; '), r.status, 'candidate transition (D9), only after the code audit confirms done');
  if (!allDone && rDone) add('remote-done-local-open', 2, key, mine.filter((s) => !done(s)).map((s) => `step ${s.step} ${s.status}`).join('; '), r.status, 'tracker says done; local work open');
}
if (steps.length && steps.every(done) && tr.ticket.statusCategory !== 'done')
  add('ticket-open', 3, tr.ticket.key, 'all steps done', tr.ticket.status, 'ticket still open (review / QA may be pending)');

const prd = (snap.prd ?? []).map((a) => norm(a.text));
for (const ac of tr.ticket.acs ?? []) {
  const n = norm(ac);
  if (!prd.some((p) => p.includes(n.slice(0, 60)) || n.includes(p.slice(0, 60)))) add('ac-missing-local', 1, tr.ticket.key, null, ac, 'tracker AC not in prd.md (new or reworded)');
}
for (const a of snap.prd ?? []) {
  const n = norm(a.text);
  if (n && !(tr.ticket.acs ?? []).some((ac) => norm(ac).includes(n.slice(0, 60)) || n.includes(norm(ac).slice(0, 60)))) add('ac-local-only', 1, tr.ticket.key, `prd.md:${a.line} ${a.text.slice(0, 120)}`, null, 'local AC not on the tracker (dropped upstream, or local-only detail)');
}

out({ ticket: tr.ticket.key, findings, byGate: findings.reduce((a, f) => ({ ...a, [f.gate]: (a[f.gate] ?? 0) + 1 }), {}) });
