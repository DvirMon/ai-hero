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

  // Commits on HEAD not yet upstream, oldest first.
  const shas = git(['rev-list', '--reverse', `${upstream}..HEAD`]).split(/\s+/).filter(Boolean);
  // Thread -> SHA map. Trailer first (rt-apply commits); then the subject
  // recorded by --existing-commit (survives the rebase, which rewrites SHAs).
  const map = {};
  const subjectOf = {};
  for (const sha of shas) {
    subjectOf[sha] = git(['log', '-1', '--format=%s', sha]).trim();
    const id = git(['log', '-1', '--format=%(trailers:key=Review-Thread,valueonly)', sha]).trim();
    if (id) map[id] = sha;
  }
  for (const [id, rec] of Object.entries(review.threads)) {
    if (map[id] || !rec.commit?.subject) continue;
    const match = shas.find((sha) => subjectOf[sha] === rec.commit.subject);
    if (match) map[id] = match;
  }
  for (const [id, sha] of Object.entries(map)) {
    if (!review.threads[id]) continue;
    const prev = review.threads[id].commit ?? {};
    review.threads[id].commit = { ...prev, sha, pushed: false };
  }
  saveReview(dir, review);

  const markPushed = () => {
    // A recorded commit is pushed when the remote branch already contains it.
    for (const rec of Object.values(review.threads)) {
      if (!rec.commit?.sha) continue;
      try {
        git(['merge-base', '--is-ancestor', rec.commit.sha, upstream]);
        rec.commit.pushed = true;
      } catch {
        rec.commit.pushed = false;
      }
    }
    saveReview(dir, review);
  };

  if (!shas.length) {
    markPushed();
    return { ok: true, pushed: 0, rebased, map };
  }
  try {
    git(['push', remote, `HEAD:refs/heads/${headRef}`]);
  } catch (e) {
    return { ok: false, error: 'push rejected; nothing was posted', detail: e.stderr?.slice(-800), map };
  }
  markPushed();
  return { ok: true, pushed: shas.length, rebased, map };
}

runIfMain(import.meta.url, main);
