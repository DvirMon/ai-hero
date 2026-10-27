#!/usr/bin/env node
import { parse, runIfMain } from '../lib/cli.mjs';
import { makeProvider } from '../lib/provider/index.mjs';
import { loadReview, saveThreads } from '../lib/state.mjs';

// Step 1: fetch unresolved threads (fully paginated) into threads.json.
export async function main(argv, deps = {}) {
  const a = parse(argv, { 'state-dir': { type: 'string' } });
  const review = loadReview(a['state-dir']);
  if (!review?.run) return { ok: false, error: 'run rt-preflight first' };
  const { provider: name, host, project, number } = review.run;
  const provider = deps.provider ?? (deps.makeProvider ?? makeProvider)(name, { host, project });
  const { pr, threads } = provider.fetchPr(number);
  const nonThread = provider.fetchNonThread(number).filter((n) => n.author !== review.run.viewer);
  const byId = Object.fromEntries(threads.map((t) => [t.id, t]));
  saveThreads(a['state-dir'], { pr, fetchedAt: new Date().toISOString(), threads: byId, nonThread });
  return { ok: true, threads: threads.length, nonThread: nonThread.length, headSha: pr.headSha };
}

runIfMain(import.meta.url, main);
