import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { userConfigFor, mergeConfig, validate, CONFIG_PATH } from '../lib/config.mjs';
import { parseIssue, resolveStateDir, excludeFromGit, writeJson, readJson } from '../lib/state.mjs';
import { matchGlob, matchAny } from '../lib/glob.mjs';
import { parseRemote, parsePrUrl, detectProvider } from '../lib/remote.mjs';

const user = userConfigFor(
  { defaults: { protectedPaths: ['infra/**'], trustedBots: ['a[bot]', 'b[bot]'], autoCategories: ['typo', 'naming'], resolve: 'all' }, projects: { 'gitlab.com/g/sub/p': { gatedPaths: ['x/**'] } } },
  'gitlab.com/g/sub/p',
);

test('config: project key (full path with subgroups) layers over defaults', () => {
  assert.deepEqual(user.gatedPaths, ['x/**']);
  assert.deepEqual(user.protectedPaths, ['infra/**']);
  assert.equal(user.resolve, 'all');
});

test('config merge: repo adds fixers (first) and unions protected/gated paths', () => {
  const { config } = mergeConfig(
    { ...user, fixers: [{ glob: '**/*.ts', skill: 'u' }] },
    { fixers: [{ glob: '**/*.ts', skill: 'r', verify: 'v {files}' }], protectedPaths: ['db/**'], gatedPaths: ['y/**'] },
  );
  assert.equal(config.fixers[0].skill, 'r');
  assert.deepEqual(config.protectedPaths.sort(), [CONFIG_PATH, 'db/**', 'infra/**'].sort());
  assert.deepEqual(config.gatedPaths.sort(), ['x/**', 'y/**']);
});

test('config merge: repo may only tighten autoCategories and trustedBots', () => {
  const { config, loosened } = mergeConfig(user, { autoCategories: ['typo', 'unused-import'], trustedBots: ['a[bot]', 'evil[bot]'] });
  assert.deepEqual(config.autoCategories, ['typo']);
  assert.deepEqual(config.trustedBots, ['a[bot]']);
  assert.deepEqual(loosened.sort(), ['autoCategories', 'trustedBots']);
});

test('config merge: repo cannot set resolve, stateDir or hosts; config file is always protected', () => {
  const { config, loosened } = mergeConfig(user, { resolve: 'none', stateDir: '/etc', hosts: { h: 'github' } });
  assert.equal(config.resolve, 'all');
  assert.equal(config.stateDir, null);
  assert.deepEqual(loosened.sort(), ['hosts', 'resolve', 'stateDir']);
  assert.ok(mergeConfig(user, null).config.protectedPaths.includes(CONFIG_PATH));
});

test('config validate rejects bad values', () => {
  assert.throws(() => validate({ autoCategories: ['bogus'] }));
  assert.throws(() => validate({ resolve: 'maybe' }));
  assert.throws(() => validate({ fixers: [{ skill: 'x' }] }));
});

test('state: {issue} from Closes #N, else branch digits', () => {
  assert.equal(parseIssue('Closes #42', 'x'), '42');
  assert.equal(parseIssue('fixes #7 and more', 'x'), '7');
  assert.equal(parseIssue('', 'feat/123-thing'), '123');
  assert.equal(parseIssue('', 'main'), null);
});

test('state: stateDir template resolves to one folder, many, or falls back', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rt-state-'));
  mkdirSync(path.join(root, 'work/a/active/42-thing/review'), { recursive: true });
  const base = { repoRoot: root, pluginData: path.join(root, 'data'), host: 'gitlab.com', project: 'g/sub/p', pr: 5 };
  const t = 'work/*/active/*{issue}*/review';
  const one = resolveStateDir({ ...base, template: t, vars: { issue: '42' } });
  assert.equal(one.source, 'template');
  assert.ok(one.dir.endsWith(path.join('42-thing', 'review')));
  mkdirSync(path.join(root, 'work/b/active/42-other/review'), { recursive: true });
  assert.equal(resolveStateDir({ ...base, template: t, vars: { issue: '42' } }).choose.length, 2);
  const none = resolveStateDir({ ...base, template: t, vars: { issue: '99' } });
  assert.equal(none.source, 'fallback');
  assert.ok(none.dir.endsWith(path.join('gitlab.com', 'g', 'sub', 'p', '5')));
  assert.equal(resolveStateDir({ ...base, template: t, vars: {} }).source, 'fallback');
  assert.equal(resolveStateDir({ ...base, template: null, vars: {} }).source, 'fallback');
});

test('state: atomic json round trip and git exclude', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'rt-excl-'));
  execFileSync('git', ['init', '-q'], { cwd: root });
  const dir = path.join(root, 'work', 'review');
  writeJson(path.join(dir, 'x.json'), { a: 1 });
  assert.deepEqual(readJson(path.join(dir, 'x.json')), { a: 1 });
  assert.equal(excludeFromGit(root, dir), true);
  assert.equal(excludeFromGit(root, dir), false, 'idempotent');
  assert.match(readFileSync(path.join(root, '.git', 'info', 'exclude'), 'utf8'), /\/work\/review\//);
  assert.equal(excludeFromGit(root, path.join(tmpdir(), 'elsewhere')), false);
});

test('glob and remote parsing', () => {
  assert.ok(matchGlob('libs/*/src/index.ts', 'libs/ui/src/index.ts'));
  assert.ok(!matchGlob('libs/*/src/index.ts', 'libs/ui/x/src/index.ts'));
  assert.ok(matchGlob('**/*.ts', 'a/b/c.ts'));
  assert.ok(matchGlob('**/*.ts', 'c.ts'));
  assert.ok(matchAny(['infra/'], 'infra/a/b.tf'));
  assert.ok(matchGlob('src/*.{ts,tsx}', 'src/a.tsx'));
  assert.deepEqual(parseRemote('git@gitlab.com:g/sub/p.git'), { host: 'gitlab.com', project: 'g/sub/p' });
  assert.deepEqual(parseRemote('https://github.com/o/r.git'), { host: 'github.com', project: 'o/r' });
  assert.deepEqual(parseRemote('ssh://git@git.example.com:2222/g/p.git'), { host: 'git.example.com', project: 'g/p' });
  assert.deepEqual(parsePrUrl('https://gitlab.com/g/sub/p/-/merge_requests/12'), { provider: 'gitlab', host: 'gitlab.com', project: 'g/sub/p', number: 12 });
  assert.deepEqual(parsePrUrl('https://github.com/o/r/pull/3'), { provider: 'github', host: 'github.com', project: 'o/r', number: 3 });
  assert.equal(detectProvider('github.com'), 'github');
  assert.equal(detectProvider('git.corp.example'), null);
  assert.equal(detectProvider('git.corp.example', { 'git.corp.example': 'gitlab' }), 'gitlab');
});
