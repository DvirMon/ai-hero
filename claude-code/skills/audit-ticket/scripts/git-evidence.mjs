#!/usr/bin/env node
// Usage: git-evidence.mjs <snapshot.json> [--base <ref>]
// Signals 1-3 of D11 per step, from git only: files changed, commits that
// name the step, spec files in the diff. Signal 4 (tests pass) is a run the
// user approves; this script only lists the specs to run.
import path from 'node:path';
import { read, git, out, expandFileEntry, globToRe } from './lib.mjs';

const args = process.argv.slice(2);
const snap = JSON.parse(read(args[0]) ?? 'null');
if (!snap) { console.error('usage: git-evidence.mjs <snapshot.json> [--base <ref>]'); process.exit(2); }
const root = snap.repoRoot;

const defaultBranch = (git(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], root) ?? 'origin/main');
const baseRef = args.includes('--base') ? args[args.indexOf('--base') + 1] : defaultBranch;
const base = git(['merge-base', 'HEAD', baseRef], root);
if (!base) { out({ error: `no merge-base between HEAD and ${baseRef}` }); process.exit(1); }

const head = git(['rev-parse', '--abbrev-ref', 'HEAD'], root);
const changed = (git(['diff', '--name-only', `${base}...HEAD`], root) ?? '').split('\n').filter(Boolean);
const dirty = (git(['status', '--porcelain'], root) ?? '').split('\n').filter(Boolean).map((l) => l.slice(3));
const commits = (git(['log', `${base}..HEAD`, '--format=%h%x09%s'], root) ?? '').split('\n').filter(Boolean)
  .map((l) => { const [sha, ...s] = l.split('\t'); return { sha, subject: s.join('\t') }; });
const SPEC = /(\.spec\.|\.test\.|__tests__\/|\/e2e\/)/;

const steps = snap.issues.flatMap((iss) => iss.steps.map((s) => {
  const patterns = s.files.flatMap(expandFileEntry);
  const match = (f) => patterns.some((p) => f === p || f.endsWith(`/${p}`) || (p.includes('*') && globToRe(p).test(f)));
  const touched = changed.filter(match);
  const missing = patterns.filter((p) => !p.includes('*') && !changed.some((f) => f === p || f.endsWith(`/${p}`)));
  const subject = s.commit_message?.trim();
  const keys = [s.jira, ...s.keys].filter(Boolean);
  const byMessage = subject ? commits.filter((c) => c.subject === subject || c.subject.startsWith(subject.slice(0, 60))) : [];
  const byKey = commits.filter((c) => keys.some((k) => c.subject.includes(k)));
  const testPlanText = s.testPlan ? read(path.join(root, s.testPlan)) ?? '' : '';
  const specs = changed.filter((f) => SPEC.test(f) && (match(f) || testPlanText.includes(path.basename(f))));
  return {
    issue: iss.dir, step: s.step, status: s.status, type: s.type,
    signal1_files: { touched, missing, uncommitted: dirty.filter(match) },
    signal2_commits: { exact: byMessage, byKey: byKey.length > 5 ? { count: byKey.length, note: 'key on most commits: weak signal' } : byKey },
    signal3_specs: specs,
    noFilesDeclared: patterns.length === 0,
  };
}));

out({ branch: head, base: baseRef, mergeBase: base, changedCount: changed.length, commitCount: commits.length, steps, specsToRun: [...new Set(steps.flatMap((s) => s.signal3_specs))] });
