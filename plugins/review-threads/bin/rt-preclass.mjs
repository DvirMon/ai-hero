#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parse, runIfMain } from '../lib/cli.mjs';
import { makeProvider } from '../lib/provider/index.mjs';
import { loadReview, saveReview, loadThreads } from '../lib/state.mjs';
import { preclassify, finalizeGate } from '../lib/triage.mjs';
import { CATEGORIES } from '../lib/config.mjs';

const DECISIONS = ['pending', 'approved', 'declined', 'deferred', 'worktree', 'answered'];
const KINDS = ['fix', 'question', 'outdated'];
const REPLY_KINDS = ['fixed', 'declined', 'question', 'already-addressed'];
const P = ['P0', 'P1', 'P2', 'P3'];
const TAGS = ['minor', 'improvement', 'nit'];

// Step 2 (default): deterministic pre-classification; writes review.json.
// Mode --update <file>: record the model's classification and the user's decisions.
export async function main(argv, deps = {}) {
  const a = parse(argv, { 'state-dir': { type: 'string' }, update: { type: 'string' } });
  const dir = a['state-dir'];
  const review = loadReview(dir);
  if (!review?.run) return { ok: false, error: 'run rt-preflight first' };
  return a.update ? update(dir, review, a.update) : scan(dir, review, deps);
}

async function scan(dir, review, deps) {
  const { run } = review;
  const provider = deps.provider ?? (deps.makeProvider ?? makeProvider)(run.provider, { host: run.host, project: run.project });
  const { threads: byId } = loadThreads(dir);
  const threads = Object.values(byId);
  const fresh = threads.filter((t) => !review.threads[t.id]);
  const recs = await preclassify({
    threads: fresh,
    viewer: run.viewer,
    prAuthor: run.prAuthor,
    config: run.config,
    hasWrite: (login, comment) => provider.hasWrite(login, comment),
  });
  Object.assign(review.threads, recs);
  saveReview(dir, review);
  const rows = threads.map((t) => {
    const r = review.threads[t.id];
    return { id: t.id, path: t.path, line: t.line, outdated: t.outdated, skipped: !!r.skipped, gate: r.gate, signal: r.signal, trusted: r.trusted, reasons: r.reasons, decision: r.decision };
  });
  const open = rows.filter((r) => !r.skipped);
  return { ok: true, total: rows.length, skipped: rows.length - open.length, needClassify: open.filter((r) => r.gate !== 'gated' || r.reasons.length === 0).length, threads: rows };
}

function update(dir, review, file) {
  const patches = JSON.parse(readFileSync(file, 'utf8'));
  const applied = [];
  for (const p of patches) {
    const rec = review.threads[p.id];
    if (!rec || rec.skipped) throw new Error(`unknown or skipped thread ${p.id}`);
    if (p.kind !== undefined) {
      if (!KINDS.includes(p.kind)) throw new Error(`kind: ${KINDS.join('|')}`);
      if (p.category != null && !CATEGORIES.includes(p.category)) throw new Error(`category: ${CATEGORIES.join('|')}`);
      rec.kind = p.kind;
      rec.category = p.category ?? null;
      rec.gate = finalizeGate(rec, { kind: p.kind, category: rec.category }, review.run.config);
    }
    if (p.p !== undefined) {
      if (p.p !== null && !P.includes(p.p)) throw new Error(`p: ${P.join('|')}`);
      rec.p = p.p;
    }
    if (p.tag !== undefined) {
      if (p.tag !== null && !TAGS.includes(p.tag)) throw new Error(`tag: ${TAGS.join('|')}`);
      rec.tag = p.tag;
    }
    if (p.decision !== undefined) {
      if (!DECISIONS.includes(p.decision)) throw new Error(`decision: ${DECISIONS.join('|')}`);
      rec.decision = p.decision;
    }
    if (p.replyKind !== undefined) {
      if (!REPLY_KINDS.includes(p.replyKind)) throw new Error(`replyKind: ${REPLY_KINDS.join('|')}`);
      rec.replyKind = p.replyKind;
    }
    if (p.replyDraft !== undefined) rec.replyDraft = String(p.replyDraft);
    applied.push({ id: p.id, gate: rec.gate, decision: rec.decision });
  }
  saveReview(dir, review);
  return { ok: true, applied };
}

runIfMain(import.meta.url, main);
