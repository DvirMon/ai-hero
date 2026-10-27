#!/usr/bin/env node
import { setTimeout as sleep } from 'node:timers/promises';
import { parse, runIfMain } from '../lib/cli.mjs';
import { makeProvider } from '../lib/provider/index.mjs';
import { loadReview, loadThreads, updateThread } from '../lib/state.mjs';
import { buildMarker, findOurReply } from '../lib/markers.mjs';
import { normLogin, shouldResolve } from '../lib/triage.mjs';

const WAITING = new Set(['pending', 'deferred', 'worktree']);

const commitUrl = (run, sha) =>
  run.provider === 'gitlab'
    ? `https://${run.host}/${run.project}/-/commit/${sha}`
    : `https://${run.host}/${run.project}/commit/${sha}`;

function bodyFor(run, rec, kind) {
  const parts = [(rec.replyDraft ?? '').trim()];
  if (kind === 'fixed') parts.push(`Fixed in [${rec.commit.sha.slice(0, 8)}](${commitUrl(run, rec.commit.sha)}).`);
  return `${parts.filter(Boolean).join('\n\n')}\n\n${buildMarker(rec.id, kind)}`;
}

// Step 8: post replies (marker + idempotency check), resolve (D11), re-request (D12).
// One request at a time, throttled for GitHub's secondary rate limit (>= 1 s between writes).
export async function main(argv, deps = {}) {
  const a = parse(argv, { 'state-dir': { type: 'string' } });
  const dir = a['state-dir'];
  const review = loadReview(dir);
  if (!review?.run) return { ok: false, error: 'run rt-preflight first' };
  const { run } = review;
  const { threads: fetched } = loadThreads(dir);
  const provider = deps.provider ?? (deps.makeProvider ?? makeProvider)(run.provider, { host: run.host, project: run.project });
  const delay = deps.delayMs ?? 1000;
  const out = { posted: [], alreadyPosted: [], resolved: [], failed: [], waiting: [] };
  let wrote = false;

  for (const [id, rec0] of Object.entries(review.threads)) {
    if (rec0.skipped) continue;
    const rec = { ...rec0, id };
    const kind = rec.commit ? 'fixed' : rec.replyKind;
    if (WAITING.has(rec.decision) || !kind || rec.reply?.posted) {
      if (WAITING.has(rec.decision)) out.waiting.push(id);
      continue;
    }
    if (kind === 'fixed' && !rec.commit.pushed) {
      out.waiting.push(id);
      continue;
    }
    if (kind !== 'fixed' && !rec.replyDraft?.trim()) continue;
    const thread = fetched[id];
    try {
      updateThread(dir, id, { reply: { posted: false, attempting: true } });
      const existing = findOurReply(provider.threadComments(run.number, id), run.viewer, id, kind);
      let reply;
      if (existing) {
        reply = { posted: true, url: existing.url ?? null };
        out.alreadyPosted.push(id);
      } else {
        if (wrote) await sleep(delay);
        const r = provider.reply(thread, run.number, bodyFor(run, rec, kind));
        wrote = true;
        reply = { posted: true, url: r.url ?? null };
        out.posted.push(id);
      }
      updateThread(dir, id, { reply });

      const humans = thread.comments.filter((c) => normLogin(c.author) !== normLogin(run.prAuthor));
      const botsOnly = humans.length > 0 && humans.every((c) => c.authorIsBot);
      if (!rec.resolved && shouldResolve({ policy: run.config.resolve, kind, gate: rec.gate, authorsAreBots: botsOnly })) {
        if (wrote) await sleep(delay);
        provider.resolve(run.number, id);
        wrote = true;
        updateThread(dir, id, { resolved: true });
        out.resolved.push(id);
      }
    } catch (e) {
      updateThread(dir, id, { error: { stage: 'post', message: e.message.slice(0, 1000) } });
      out.failed.push({ id, error: e.message.slice(0, 300) });
    }
  }

  // D12: re-request a human reviewer only when none of their threads still waits on us.
  const final = loadReview(dir);
  const authorsOf = (id) =>
    fetched[id].comments.filter((c) => !c.authorIsBot && normLogin(c.author) !== normLogin(run.prAuthor));
  const stillWaiting = new Set();
  const handled = new Map();
  for (const [id, rec] of Object.entries(final.threads)) {
    if (rec.skipped || !fetched[id]) continue;
    const isWaiting =
      WAITING.has(rec.decision) ||
      out.failed.some((f) => f.id === id) ||
      (!rec.reply?.posted && rec.decision === 'approved');
    const done = rec.reply?.posted && ['fixed', 'declined', 'question', 'already-addressed'].includes(rec.commit ? 'fixed' : rec.replyKind);
    for (const c of authorsOf(id)) {
      if (isWaiting) stillWaiting.add(normLogin(c.author));
      else if (done) handled.set(normLogin(c.author), c);
    }
  }
  const logins = [...handled.keys()].filter((l) => !stillWaiting.has(l));
  let rerequest = { supported: true, requested: [], skipped: [] };
  if (logins.length) {
    try {
      const ids = Object.fromEntries(logins.map((l) => [l, handled.get(l).authorId]));
      const names = Object.fromEntries(logins.map((l) => [l, handled.get(l).author]));
      rerequest = provider.rerequest(run.number, logins.map((l) => names[l]), Object.fromEntries(Object.entries(names).map(([l, n]) => [n, ids[l]])));
    } catch (e) {
      rerequest = { supported: false, requested: [], error: e.message.slice(0, 300) };
    }
  }
  return { ok: out.failed.length === 0, ...out, rerequest };
}

runIfMain(import.meta.url, main);
