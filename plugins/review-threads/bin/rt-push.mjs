#!/usr/bin/env node
import { parse, runIfMain } from '../lib/cli.mjs';
import { git as realGit } from '../lib/exec.mjs';
import { loadReview, saveReview } from '../lib/state.mjs';

// Step 7: fetch, rebase if the remote moved, re-map trailers to SHAs, push once (D5/D6).
export async function main(argv, deps = {}) {
  const git = deps.git ?? realGit;
  const a = parse(argv, { 'state-dir': { type: 'string' } });
  const dir = a['state-dir'];
  const review = loadReview(dir);
  if (!review?.run) return { ok: false, error: 'run rt-preflight first' };
  const { remote, headRef } = review.run;
  const upstream = `${remote}/${headRef}`;

  git(['fetch', remote, headRef]);
  const behind = Number(git(['rev-list', '--count', `HEAD..${upstream}`]).trim());
  let rebased = false;
  if (behind > 0) {
    try {
      git(['rebase', upstream]);
      rebased = true;
    } catch (e) {
      try { git(['rebase', '--abort']); } catch { /* nothing to abort */ }
      return { ok: false, error: `rebase onto ${upstream} failed; nothing pushed`, detail: e.stderr?.slice(-800) };
    }
  }

  // Thread -> SHA map from the Review-Thread trailer (survives the rebase).
  const shas = git(['rev-list', '--reverse', `${upstream}..HEAD`]).split(/\s+/).filter(Boolean);
  const map = {};
  for (const sha of shas) {
    const id = git(['log', '-1', '--format=%(trailers:key=Review-Thread,valueonly)', sha]).trim();
    if (id) map[id] = sha;
  }
  for (const [id, sha] of Object.entries(map)) if (review.threads[id]) review.threads[id].commit = { sha, pushed: false };
  saveReview(dir, review);

  if (!shas.length) return { ok: true, pushed: 0, rebased, map };
  try {
    git(['push', remote, `HEAD:refs/heads/${headRef}`]);
  } catch (e) {
    return { ok: false, error: 'push rejected; nothing was posted', detail: e.stderr?.slice(-800), map };
  }
  for (const id of Object.keys(map)) if (review.threads[id]) review.threads[id].commit.pushed = true;
  saveReview(dir, review);
  return { ok: true, pushed: shas.length, rebased, map };
}

runIfMain(import.meta.url, main);
