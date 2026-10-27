#!/usr/bin/env node
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { parse, runIfMain } from '../lib/cli.mjs';
import { git as realGit, shell as realShell } from '../lib/exec.mjs';
import { loadReview, loadThreads, updateThread } from '../lib/state.mjs';
import { checkShape, protectedHits } from '../lib/shape.mjs';
import { matchGlob, normPath } from '../lib/glob.mjs';
import { fixerFor } from '../lib/config.mjs';

const UNSAFE = /["`$%\r\n]/;

function changedFiles(git, root) {
  const parts = git(['-C', root, 'status', '--porcelain', '-z', '-uall']).split('\0').filter(Boolean);
  const files = [];
  for (let i = 0; i < parts.length; i++) {
    const xy = parts[i].slice(0, 2);
    files.push({ path: normPath(parts[i].slice(3)), untracked: xy === '??', deleted: xy.includes('D') });
    if (/[RC]/.test(xy)) i++;
  }
  return files;
}

function revert(git, root, files) {
  for (const f of files) {
    if (f.untracked) {
      git(['-C', root, 'rm', '--cached', '-q', '--ignore-unmatch', '--', f.path]);
      rmSync(path.join(root, f.path), { force: true });
    }
    else git(['-C', root, 'restore', '--source=HEAD', '--staged', '--worktree', '--', f.path]);
  }
}

// Steps 4/6 per thread: checks the fixer's edit, verifies, commits or reverts.
// Expected failures are { ok: true, status: 'reverted' }: the thread moves to gated.
export async function main(argv, deps = {}) {
  const git = deps.git ?? realGit;
  const shell = deps.shell ?? realShell;
  const a = parse(argv, {
    'state-dir': { type: 'string' },
    thread: { type: 'string' },
    lane: { type: 'string' },
    'fix-file': { type: 'string' },
  });
  const dir = a['state-dir'];
  const review = loadReview(dir);
  const rec = review?.threads?.[a.thread];
  if (!rec) return { ok: false, error: `unknown thread ${a.thread}` };
  const cfg = review.run.config;
  const thread = loadThreads(dir).threads[a.thread];
  const fix = JSON.parse(readFileSync(a['fix-file'], 'utf8'));
  const root = git(['rev-parse', '--show-toplevel']).trim();
  const lane = a.lane;

  if (lane === 'auto' && !(rec.gate === 'auto' && rec.category)) return { ok: false, error: 'thread is not in the auto lane' };
  if (lane === 'gated' && rec.decision !== 'approved') return { ok: false, error: 'thread is not approved' };
  if (lane !== 'auto' && lane !== 'gated') return { ok: false, error: 'lane: auto|gated' };

  const files = changedFiles(git, root);
  const fail = (stage, message, extra = {}) => {
    revert(git, root, files);
    updateThread(dir, a.thread, {
      gate: 'gated',
      decision: 'pending',
      error: { stage, message: String(message).slice(0, 2000), ...extra },
    });
    return { ok: true, status: 'reverted', stage, message: String(message).slice(0, 600), ...extra };
  };

  if (fix.status !== 'fixed') return fail('fixer', fix.reason || 'fixer reported cannot-fix');
  if (!files.length) return fail('fixer', 'fixer made no change');
  const paths = files.map((f) => f.path);
  if (!fix.commitMessage?.trim()) return fail('fixer', 'fixer gave no commit message');
  if (paths.some((p) => UNSAFE.test(p))) return fail('checks', 'unsafe file name');

  // D3: protected-path check on the resulting diff, plus the shape check for auto.
  const hits = protectedHits(paths, cfg.protectedPaths, lane === 'gated' ? thread.path : null);
  if (hits.length) return fail('protected-path', `touches protected: ${hits.join(', ')}`);
  if (lane === 'auto') {
    const shaped = files.map((f) => ({
      path: f.path,
      old: f.untracked ? null : git(['-C', root, 'show', `HEAD:${f.path}`]),
      new: f.deleted ? null : readFileSync(path.join(root, f.path), 'utf8'),
    }));
    const shape = checkShape(rec.category, shaped, { anchor: thread.path, maxLines: cfg.projectRuleMaxLines });
    if (!shape.ok) return fail('shape', shape.reason);
  }

  // D4: verify after the edit, before the commit. Auto needs a configured command.
  const fixers = [...new Set(paths.map((p) => fixerFor(cfg, p, matchGlob)).filter(Boolean))];
  const commands = [...new Set(fixers.map((f) => f.verify).filter(Boolean))];
  if (lane === 'auto' && !commands.length) return fail('verify', 'no verify command configured for these files');
  for (const cmd of commands) {
    const sep = fixers.find((f) => f.verify === cmd)?.sep ?? ' ';
    const list = paths.map((p) => `"${p}"`).join(sep);
    const res = shell(cmd.replaceAll('{files}', list), { cwd: root, timeout: cfg.verifyTimeoutMs });
    if (!res.ok) return fail('verify', res.output.slice(-1500));
  }

  // Commit: the repo's own hooks judge the fixer's message (design §4).
  try {
    git(['-C', root, 'add', '--', ...paths]);
    const msg = git(['interpret-trailers', '--trailer', `Review-Thread: ${a.thread}`], { input: `${fix.commitMessage.trim()}\n` });
    git(['-C', root, 'commit', '-F', '-'], { input: msg });
  } catch (e) {
    const hint = /trailer|footer|Review-Thread/i.test(e.stderr || e.message) ? 'hook-may-reject-trailer' : undefined;
    return fail('commit', e.stderr || e.message, hint ? { hint } : {});
  }
  const sha = git(['-C', root, 'rev-parse', 'HEAD']).trim();
  updateThread(dir, a.thread, {
    commit: { sha, pushed: false },
    decision: 'approved',
    replyKind: 'fixed',
    replyDraft: fix.replyDraft ?? rec.replyDraft ?? '',
    error: null,
  });
  return { ok: true, status: 'committed', sha, files: paths };
}

runIfMain(import.meta.url, main);
