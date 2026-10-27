import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkShape, checkTypo, checkUnusedImport, checkNaming, checkProjectRule, protectedHits } from '../lib/shape.mjs';

const f = (path, o, n) => [{ path, old: o, new: n }];
const shape = (cat, o, n, path = 'src/a.ts') => checkShape(cat, f(path, o, n), { anchor: path });

test('typo: comment and string edits pass', () => {
  assert.equal(shape('typo', '// helo\nconst a = "wrold";\n', '// hello\nconst a = "world";\n').ok, true);
  assert.equal(shape('typo', '/* a\n b */ let x = `hi ${y}`;', '/* a\n bb */ let x = `ho ${y}`;').ok, true);
});

test('typo: a code change, or a change inside ${} of a template, fails', () => {
  assert.equal(shape('typo', 'const a = 1; // x', 'const a = 2; // x').ok, false);
  assert.equal(shape('typo', 'const s = `a ${foo}`;', 'const s = `a ${bar}`;').ok, false);
  assert.equal(shape('typo', 'const a = 1;', 'const a = 1;').ok, false);
});

test('typo: prose files pass, unknown file types fail closed', () => {
  assert.equal(shape('typo', 'teh docs', 'the docs', 'README.md').ok, true);
  assert.equal(shape('typo', '<p>teh</p>', '<p>the</p>', 'a.html').ok, false);
});

test('unused-import: specifier or whole-import removal passes; reuse, widening, code edits fail', () => {
  const src = "import { a, b } from 'x';\nimport c from 'y';\nuse(a);\n";
  assert.equal(shape('unused-import', src, "import { a } from 'x';\nuse(a);\n").ok, true, 'b and c removed, neither referenced');
  assert.equal(shape('unused-import', src, "import { b } from 'x';\nimport c from 'y';\nuse(a);\n").ok, false, 'a is still referenced');
  assert.equal(shape('unused-import', src, "import { a, b, d } from 'x';\nimport c from 'y';\nuse(a);\n").ok, false, 'widened import');
  assert.equal(shape('unused-import', src, "import { a } from 'x';\nuse(a, 1);\n").ok, false, 'code changed');
  assert.equal(shape('unused-import', src, src).ok, false, 'nothing removed');
});

test('naming: consistent rename of a local symbol passes', () => {
  const o = 'function f() { const tmp = 1; return tmp + 1; }';
  const n = 'function f() { const total = 1; return total + 1; }';
  assert.equal(shape('naming', o, n).ok, true);
});

test('naming: exported, partial, member, colliding and double renames fail', () => {
  assert.equal(shape('naming', 'export const tmp = 1; use(tmp);', 'export const total = 1; use(total);').ok, false);
  assert.equal(shape('naming', 'export { tmp };\nconst tmp = 1;', 'export { total };\nconst total = 1;').ok, false);
  assert.equal(shape('naming', 'const tmp = 1; use(tmp);', 'const total = 1; use(tmp);').ok, false);
  assert.equal(shape('naming', 'const tmp = 1; o.tmp = tmp;', 'const total = 1; o.total = total;').ok, false);
  assert.equal(shape('naming', 'const tmp = 1; const total = 2;', 'const total = 1; const total = 2;').ok, false);
  assert.equal(shape('naming', 'const a = 1; const b = 2;', 'const c = 1; const d = 2;').ok, false);
});

test('project-rule: small single-file edit passes; big or export edits fail', () => {
  assert.equal(checkProjectRule('a.ts', 'a\nb\nc', 'a\nB\nc').ok, true);
  assert.equal(checkProjectRule('a.ts', 'a\nb', 'a\nb\n' + Array.from({ length: 20 }, (_, i) => `l${i}`).join('\n')).ok, false);
  assert.equal(checkProjectRule('a.ts', 'export const a = 1;', 'export const a = 2;').ok, false);
});

test('scope: only the anchor file, only modifications', () => {
  assert.equal(checkShape('typo', [...f('src/a.ts', '// a', '// b'), ...f('src/b.ts', '// a', '// b')], { anchor: 'src/a.ts' }).ok, false);
  assert.equal(checkShape('typo', f('src/other.ts', '// a', '// b'), { anchor: 'src/a.ts' }).ok, false);
  assert.equal(checkShape('typo', [{ path: 'src/a.ts', old: null, new: '// b' }], { anchor: 'src/a.ts' }).ok, false);
  assert.equal(checkShape('typo', [], { anchor: 'src/a.ts' }).ok, false);
});

test('protected paths on the resulting diff; the approved anchor may be allowed', () => {
  const protectedPaths = ['infra/**', '.claude/review-threads.json'];
  assert.deepEqual(protectedHits(['src/a.ts', 'infra/x.tf'], protectedPaths), ['infra/x.tf']);
  assert.deepEqual(protectedHits(['infra/x.tf'], protectedPaths, 'infra/x.tf'), []);
  assert.deepEqual(protectedHits(['.claude/review-threads.json'], protectedPaths), ['.claude/review-threads.json']);
});

test('direct checkers export', () => {
  assert.equal(typeof checkTypo, 'function');
  assert.equal(typeof checkUnusedImport, 'function');
  assert.equal(typeof checkNaming, 'function');
});
