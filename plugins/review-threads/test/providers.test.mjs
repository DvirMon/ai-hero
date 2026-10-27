import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGithub } from '../lib/provider/github.mjs';
import { createGitlab } from '../lib/provider/gitlab.mjs';

// Fixtures follow the field shapes in the GitHub GraphQL and GitLab REST docs; they are
// hand-built, not recorded from a live API.
const fx = (n) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');

function ghRunner(calls = []) {
  return (args) => {
    const vars = {};
    let query = '';
    for (let i = 0; i < args.length; i++)
      if (args[i] === '-f' || args[i] === '-F') {
        const [k, ...v] = args[i + 1].split('=');
        if (k === 'query') query = v.join('=');
        else vars[k] = v.join('=');
      }
    calls.push({ args, query, vars });
    if (args[1] === 'graphql') {
      if (query.includes('reviewThreads')) return fx(vars.after === 'T1' ? 'github-pr-page2.json' : 'github-pr-page1.json');
      if (query.includes('node(id')) return fx('github-comments-more.json');
      if (query.includes('states: [PENDING]')) return JSON.stringify({ data: { repository: { pullRequest: { reviews: { totalCount: 1 } } } } });
    }
    if (args[1]?.startsWith('repos/o/r/collaborators/'))
      return JSON.stringify({ permission: args[1].includes('/rd/') ? 'read' : 'write', role_name: args[1].includes('/maint/') ? 'maintain' : args[1].includes('/rd/') ? 'read' : 'write' });
    if (args[1] === 'user') return JSON.stringify({ login: 'dvir' });
    if (args[1]?.endsWith('/replies')) return JSON.stringify({ id: 5, html_url: 'https://x/r5' });
    throw new Error(`unexpected gh call ${args.join(' ')}`);
  };
}

test('github: paginates threads and nested comments, drops resolved threads', () => {
  const calls = [];
  const gh = createGithub({ host: 'github.com', project: 'o/r', runner: ghRunner(calls) });
  const { pr, threads } = gh.fetchPr(7);
  assert.deepEqual(threads.map((t) => t.id), ['PRRT_a', 'PRRT_b']);
  assert.equal(threads[0].comments.length, 2, 'second comment page was followed');
  assert.deepEqual(threads[0].authors, ['alice', 'dvir']);
  assert.equal(threads[0].replyKey, '1001');
  assert.equal(calls.filter((c) => c.query.includes('reviewThreads')).length, 2);
  assert.equal(calls.filter((c) => c.query.includes('node(id')).length, 1);
  assert.equal(pr.headSha, 'abc123');
  assert.equal(pr.pushable, true);
});

test('github: outdated flag, line fallback and bot detection', () => {
  const gh = createGithub({ host: 'github.com', project: 'o/r', runner: ghRunner() });
  const b = gh.fetchPr(7).threads[1];
  assert.equal(b.outdated, true);
  assert.equal(b.line, 5);
  assert.equal(b.comments[0].authorIsBot, true);
});

test('github: fork PR is not pushable', () => {
  const page = JSON.parse(fx('github-pr-page2.json'));
  page.data.repository.pullRequest.isCrossRepository = true;
  const gh = createGithub({ host: 'github.com', project: 'o/r', runner: () => JSON.stringify(page) });
  const { pr } = gh.fetchPr(7);
  assert.equal(pr.pushable, false);
  assert.equal(pr.pushableReason, 'fork PR');
});

test('github: write access uses role_name, pending draft and REST reply', () => {
  const gh = createGithub({ host: 'github.com', project: 'o/r', runner: ghRunner() });
  assert.equal(gh.hasWrite('maint'), true);
  assert.equal(gh.hasWrite('rd'), false);
  assert.equal(gh.hasPendingDraft(7), true);
  const r = gh.reply({ replyKey: '1001' }, 7, 'hi');
  assert.equal(r.url, 'https://x/r5');
});

function glRunner(discussionPages) {
  return (args) => {
    const p = args[1];
    if (p === 'user') return JSON.stringify({ id: 1, username: 'dvir' });
    if (p.includes('/members/all/')) return JSON.stringify({ access_level: p.endsWith('/2') ? 20 : 30 });
    if (p.includes('/draft_notes')) return '[]';
    if (p.includes('/discussions?')) return JSON.stringify(discussionPages(Number(p.match(/[?&]page=(\d+)/)[1])));
    if (/merge_requests\/5$/.test(p)) return fx('gitlab-mr.json');
    throw new Error(`unexpected glab call ${args.join(' ')}`);
  };
}

test('gitlab: normalizes DiffNote discussions, skips resolved and individual notes', () => {
  const rows = JSON.parse(fx('gitlab-discussions.json'));
  const gl = createGitlab({ host: 'gitlab.com', project: 'g/sub/p', runner: glRunner(() => rows) });
  const { pr, threads } = gl.fetchPr(5);
  assert.deepEqual(threads.map((t) => t.id), ['d1']);
  assert.equal(threads[0].path, 'src/a.ts');
  assert.equal(threads[0].outdated, false);
  assert.equal(threads[0].staleAnchor, true);
  assert.equal(pr.pushable, true);
  assert.deepEqual(gl.fetchNonThread(5).map((n) => n.author), ['carol']);
});

test('gitlab: follows pagination until a short page', () => {
  const rows = JSON.parse(fx('gitlab-discussions.json'));
  const filler = Array.from({ length: 100 }, (_, i) => ({ id: `n${i}`, individual_note: true, notes: [{ id: i, body: 'x', system: false, author: { username: 'z' } }] }));
  const seen = [];
  const gl = createGitlab({
    host: 'gitlab.com',
    project: 'g/p',
    runner: glRunner((page) => {
      seen.push(page);
      return page === 1 ? filler : rows;
    }),
  });
  const { threads } = gl.fetchPr(5);
  assert.deepEqual(seen, [1, 2]);
  assert.deepEqual(threads.map((t) => t.id), ['d1']);
});

test('gitlab: write access needs Developer (30)', () => {
  const gl = createGitlab({ host: 'gitlab.com', project: 'g/p', runner: glRunner(() => []) });
  assert.equal(gl.hasWrite('x', { authorId: 3 }), true);
  assert.equal(gl.hasWrite('x', { authorId: 2 }), false);
});
