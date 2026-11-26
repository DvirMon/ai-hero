#!/usr/bin/env node
// Perceptual pixel diff of a Figma render against a local render (looks-same: CIEDE2000, antialiasing tolerant).
// node figma-pixel-diff.mjs --figma f.png --local l.png --out dir [--crop-figma x,y,w,h] [--crop-local x,y,w,h] [--tolerance 4]
import looksSame from 'looks-same';
import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const figma = arg('figma');
const local = arg('local');
const out = arg('out');
if (!figma || !local || !out) {
  console.error('usage: figma-pixel-diff.mjs --figma f.png --local l.png --out dir [--crop-figma x,y,w,h] [--crop-local x,y,w,h] [--tolerance 4]');
  process.exit(2);
}
mkdirSync(out, { recursive: true });

const size = (file) => {
  const o = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file]).toString();
  return { w: Number(/pixelWidth: (\d+)/.exec(o)[1]), h: Number(/pixelHeight: (\d+)/.exec(o)[1]) };
};
const crop = (src, dst, x, y, w, h) =>
  execFileSync('sips', ['-c', String(h), String(w), '--cropOffset', String(y), String(x), src, '--out', dst], { stdio: 'ignore' });

const prepare = (src, name, rect) => {
  const dst = join(out, `${name}.png`);
  copyFileSync(src, dst);
  if (rect) {
    const [x, y, w, h] = rect.split(',').map(Number);
    crop(dst, dst, x, y, w, h);
  }
  return dst;
};
const a = prepare(figma, 'figma', arg('crop-figma'));
const b = prepare(local, 'local', arg('crop-local'));

const sa = size(a);
const sb = size(b);
const w = Math.min(sa.w, sb.w);
const h = Math.min(sa.h, sb.h);
if (sa.w !== sb.w || sa.h !== sb.h) {
  crop(a, a, 0, 0, w, h);
  crop(b, b, 0, 0, w, h);
}

const result = await looksSame(a, b, {
  tolerance: Number(arg('tolerance', 4)),
  antialiasingTolerance: 3,
  ignoreAntialiasing: true,
  shouldCluster: true,
  clustersSize: 12,
});
await looksSame.createDiff({ reference: a, current: b, diff: join(out, 'diff.png'), highlightColor: '#ff00ff', tolerance: Number(arg('tolerance', 4)), ignoreAntialiasing: true });

const clusters = (result.diffClusters || []).map((c) => ({ x: c.left, y: c.top, w: c.right - c.left + 1, h: c.bottom - c.top + 1 }));
const diffArea = clusters.reduce((sum, c) => sum + c.w * c.h, 0);
console.log(
  JSON.stringify(
    {
      equal: result.equal,
      figmaSize: sa,
      localSize: sb,
      comparedSize: { w, h },
      sizeMismatch: sa.w !== sb.w || sa.h !== sb.h,
      diffAreaPct: Math.round((diffArea / (w * h)) * 10000) / 100,
      clusters: clusters.slice(0, 25),
      diffImage: join(out, 'diff.png'),
    },
    null,
    1
  )
);
