import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { main as apply } from '../bin/rt-apply.mjs';
import { main as post } from '../bin/rt-post.mjs';
import { main as preclassUpdate } from '../bin/rt-preclass.mjs';
import { DEFAULTS, CONFIG_PATH } from '../lib/config.mjs';
import { saveReview, loadReview, saveThreads, writeJson } from '../lib/state.mjs';
import { buildMarker } from '../lib/markers.mjs';
import { git as realGit } from '../lib/exec.mjs';

const OK_VERIFY = `node -e "process.exit(0)" {files}`;
const BAD_VERIFY = `node -e "process.exit(1)" {files}`;

function repo(files = { 'src/a.js': '// helo\nconst x = 1;\n' }) {
  const root = mkdtempSync(path.join(tmpdir(), 'rt-repo-'));
  const g = (args, opts) => realGit(args, { cwd: root, ...opts });
  g(['init', '-q', '-b', 'main']);
  g(['config', 'user.email', 't@example.com']);
  g(['config', 'user.name', 't']);
  g(['config', 'core.hooksPath', path.join(root, 'nohooks')]);
  for (const [f, c] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    writeFileSync(path.join(root, f), c);
  }
  g(['add', '-A']);
  g(['commit', '-q', '-m', 'init']);
  return { root, g };
}

function state(root, { gate = 'auto', category = 'typo', verify = OK_VERIFY, decision = 'pending', threadPath = 'src/a.js' } = {}) {
  const dir = `${root}-state`;
  const config = { ...DEFAULTS, protectedPaths: [CONFIG_PATH, 'infra/**'], fixers: [{ glob: '**/*.js', verify }] };
  saveReview(dir, { version: 1, run: { provider: 'github', host: 'github.com', project: 'o/r', number: 1, remote: 'origin', viewer: 'dvir', prAuthor: 'dvir', headRef: 'f', baseRef: 'main', config }, threads: { t1: { gate, category, decision, candidate: true, signal: 'none', commit: null, reply: null, resolved: false, error: null } } });
  saveThreads(dir, { pr: {}, threads: { t1: { id: 't1', path: threadPath, line: 1, comments: [{ author: 'alice', body: 'nit: typo' }] } }, nonThread: [] });
  return dir;
}

const fixFile = (root, msg = '✏️ fix(a): typo\n\nRefs: none') => {
  const f = path.join(root, '..', `fix-${path.basename(root)}.json`);
  writeJson(f, { status: 'fixed', files: ['src/a.js'], commitMessage: msg, replyDraft: 'Fixed the typo.', reason: '' });
  return f;
};

const run = (root, dir, lane = 'auto') =>
  apply(['--state-dir', dir, '--thread', 't1', '--lane', lane, '--fix-file', fixFile(root)], { git: (a, o) => realGit(a, { cwd: root, ...o }) });

test('apply: a shaped, verified auto fix is committed with the Review-Thread trailer', async () => {
  const { root, g } = repo();
  const dir = state(root);
  writeFileSync(path.join(root, 'src/a.js'), '// hello\nconst x = 1;\n');
  const res = await run(root, dir);
  assert.equal(res.status, 'committed');
  const msg = g(['log', '-1', '--format=%B']);
  assert.match(msg, /Refs: none\nReview-Thread: t1/);
  assert.equal(loadReview(dir).threads.t1.commit.sha, res.sha);
  assert.equal(g(['status', '--porcelain']).trim(), '');
});

test('apply: a shape mismatch reverts the edit and moves the thread to gated', async () => {
  const { root, g } = repo();
  const dir = state(root);
  writeFileSync(path.join(root, 'src/a.js'), '// helo\nconst x = 2;\n');
  const res = await run(root, dir);
  assert.equal(res.status, 'reverted');
  assert.equal(res.stage, 'shape');
  assert.equal(readFileSync(path.join(root, 'src/a.js'), 'utf8'), '// helo\nconst x = 1;\n');
  assert.equal(loadReview(dir).threads.t1.gate, 'gated');
  assert.equal(g(['rev-list', '--count', 'HEAD']).trim(), '1');
});

test('apply: a verify failure reverts; auto without a verify command is refused', async () => {
  let { root } = repo();
  let dir = state(root, { verify: BAD_VERIFY });
  writeFileSync(path.join(root, 'src/a.js'), '// hello\nconst x = 1;\n');
  const bad = await run(root, dir);
  assert.equal(bad.stage, 'verify');
  assert.equal(readFileSync(path.join(root, 'src/a.js'), 'utf8'), '// helo\nconst x = 1;\n');

  ({ root } = repo());
  dir = state(root, { verify: null });
  writeFileSync(path.join(root, 'src/a.js'), '// hello\nconst x = 1;\n');
  assert.equal((await run(root, dir)).stage, 'verify');
});

test('apply: a protected path in the diff reverts, even for the gated lane', async () => {
  const { root } = repo({ 'src/a.js': '// helo\n', 'infra/x.js': 'a\n' });
  const dir = state(root, { gate: 'gated', category: null, decision: 'approved' });
  writeFileSync(path.join(root, 'src/a.js'), '// hello\n');
  writeFileSync(path.join(root, 'infra/x.js'), 'b\n');
  const res = await run(root, dir, 'gated');
  assert.equal(res.stage, 'protected-path');
  assert.equal(readFileSync(path.join(root, 'infra/x.js'), 'utf8'), 'a\n');
});

test('apply: a commit-hook rejection reverts and flags a possible trailer rejection', async () => {
  const { root, g } = repo();
  const dir = state(root);
  const hooks = path.join(root, 'hooks');
  mkdirSync(hooks);
  writeFileSync(path.join(hooks, 'commit-msg'), '#!/bin/sh\necho "footer not allowed: Review-Thread" >&2\nexit 1\n', { mode: 0o755 });
  g(['config', 'core.hooksPath', hooks]);
  writeFileSync(path.join(root, 'src/a.js'), '// hello\nconst x = 1;\n');
  const res = await run(root, dir);
  assert.equal(res.stage, 'commit');
  assert.equal(res.hint, 'hook-may-reject-trailer');
  assert.equal(readFileSync(path.join(root, 'src/a.js'), 'utf8'), '// helo\nconst x = 1;\n');
});

test('apply: the auto lane refuses a thread that is not auto', async () => {
  const { root } = repo();
  const dir = state(root, { gate: 'gated' });
  const res = await run(root, dir);
  assert.equal(res.ok, false);
});

test('preclass --update: model proposals become gates; user decisions are validated', async () => {
  const { root } = repo();
  const dir = state(root, { gate: null, category: null });
  const patch = path.join(dir, 'patch.json');
  writeJson(patch, [{ id: 't1', kind: 'fix', category: 'typo', p: 'P3', tag: 'nit' }]);
  const r1 = await preclassUpdate(['--state-dir', dir, '--update', patch]);
  assert.equal(r1.applied[0].gate, 'auto');
  writeJson(patch, [{ id: 't1', decision: 'maybe' }]);
  await assert.rejects(() => preclassUpdate(['--state-dir', dir, '--update', patch]));
});

// ---- rt-post ----
function fakeProvider({ existing = [], threadsById = {} } = {}) {
  const calls = { reply: [], resolve: [], rerequest: [] };
  return {
    calls,
    threadComments: () => existing,
    reply: (t, n, body) => { calls.reply.push(body); return { id: '1', url: 'https://x/1' }; },
    resolve: (n, id) => calls.resolve.push(id),
    rerequest: (n, logins) => { calls.rerequest.push(logins); return { supported: true, requested: logins }; },
  };
}

function postState(root, recs) {
  const dir = path.join(root, '.state');
  const config = { ...DEFAULTS };
  const comment = (a, bot = false) => ({ author: a, authorIsBot: bot, body: 'x', createdAt: '2026-10-01T10:00:00Z' });
  const threads = {};
  const rtThreads = {};
  for (const [id, r] of Object.entries(recs)) {
    threads[id] = { id, path: 'a.ts', comments: [comment(r.author ?? 'alice', r.bot)] };
    rtThreads[id] = { gate: 'gated', decision: 'approved', commit: null, reply: null, resolved: false, error: null, ...r.rec };
  }
  saveReview(dir, { version: 1, run: { provider: 'github', host: 'github.com', project: 'o/r', number: 7, viewer: 'dvir', prAuthor: 'dvir', config }, threads: rtThreads });
  saveThreads(dir, { pr: {}, threads, nonThread: [] });
  return dir;
}

test('post: replies with a marker, resolves auto threads, leaves gated human threads open', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rt-post-'));
  const dir = postState(root, {
    auto: { rec: { gate: 'auto', commit: { sha: 'aaaaaaaa11', pushed: true }, replyDraft: 'Fixed.' } },
    human: { author: 'bob', rec: { commit: { sha: 'bbbbbbbb22', pushed: true }, replyDraft: 'Done.' } },
  });
  const p = fakeProvider();
  const res = await post(['--state-dir', dir], { provider: p, delayMs: 0 });
  assert.deepEqual(res.posted.sort(), ['auto', 'human']);
  assert.deepEqual(res.resolved, ['auto']);
  assert.match(p.calls.reply[0], /<!-- review-threads:v1 thread=auto decision=fixed -->/);
  assert.match(p.calls.reply[0], /commit\/aaaaaaaa11/);
  assert.deepEqual([...p.calls.rerequest[0]].sort(), ['alice', 'bob']);
});

test('post: idempotent when our marked reply already exists; a retry never double-posts', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rt-post-'));
  const dir = postState(root, { t: { rec: { commit: { sha: 'cccccccc33', pushed: true }, replyDraft: 'Done.' } } });
  const p = fakeProvider({ existing: [{ author: 'dvir', body: `Done.\n${buildMarker('t', 'fixed')}`, url: 'https://x/old' }] });
  const res = await post(['--state-dir', dir], { provider: p, delayMs: 0 });
  assert.deepEqual(res.alreadyPosted, ['t']);
  assert.equal(p.calls.reply.length, 0);
  assert.equal(loadReview(dir).threads.t.reply.url, 'https://x/old');
});

test('post: unpushed commits, declined-without-reply and waiting threads post nothing; reviewers with waiting threads are not re-requested', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rt-post-'));
  const dir = postState(root, {
    unpushed: { rec: { commit: { sha: 'd', pushed: false }, replyDraft: 'x' } },
    waiting: { rec: { decision: 'deferred' } },
    declined: { author: 'bob', rec: { decision: 'declined', replyKind: 'declined', replyDraft: 'Not changing: see ADR.' } },
  });
  const p = fakeProvider();
  const res = await post(['--state-dir', dir], { provider: p, delayMs: 0 });
  assert.deepEqual(res.posted, ['declined']);
  assert.deepEqual(res.resolved, [], 'declines never resolve');
  assert.equal(p.calls.reply.length, 1);
  assert.deepEqual(p.calls.rerequest, [['bob']], 'alice still has waiting threads; bob got a reply to his declined thread');
});

test('post: nothing to do leaves the state dir untouched', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rt-post-'));
  const dir = postState(root, {});
  const res = await post(['--state-dir', dir], { provider: fakeProvider(), delayMs: 0 });
  assert.equal(res.ok, true);
  assert.ok(existsSync(path.join(dir, 'review.json')));
});
