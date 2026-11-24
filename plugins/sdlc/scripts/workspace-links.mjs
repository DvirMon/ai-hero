#!/usr/bin/env node
// Ticket workspace links: writes nav lines, D<n>/ac-N anchors, D<n> links and index.md
// (default, idempotent) or only checks them (--check; exit 1 on any problem).
// usage: node workspace-links.mjs <workspace> [--write | --check]
// Contract: plugins/sdlc/contracts/workspace-links.md
import fs from 'node:fs';
import path from 'node:path';


if (process.argv.includes('--check')) {
  process.chdir(path.resolve(process.argv[2]));
  const problems = [];
  const log0 = console.log;
  console.log = (...a) => { const s = a.join(' '); if (/^(BROKEN|NO ANCHOR|MISSING)/.test(s)) problems.push(s); };
  const walkC = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.name === 'audit' || e.name.startsWith('.') ? [] : e.isDirectory() ? walkC(path.join(d, e.name)) : [path.join(d, e.name)]));
  const mdC = walkC('.').filter((f) => f.endsWith('.md'));
  for (const f of mdC) {
    const t = fs.readFileSync(f, 'utf8');
    if (path.basename(f) !== 'index.md' && !/<!-- nav -->$/m.test(t)) problems.push(`MISSING nav line: ${f}`);
    for (const m of t.matchAll(/\]\(([^)#\s]*)(#[^)]*)?\)/g)) {
      const [, p, a] = m;
      if (!p || /^https?:/.test(p)) continue;
      const tp = path.join(path.dirname(f), p);
      if (!fs.existsSync(tp)) { problems.push(`BROKEN ${f} -> ${p}`); continue; }
      if (a && tp.endsWith('.md')) {
        const id = a.slice(1);
        const tt = fs.readFileSync(tp, 'utf8');
        const slug = (h) => h.replace(/^#+ /, '').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
        if (!tt.includes(`id="${id}"`) && !tt.split('\n').some((l) => /^#+ /.test(l) && slug(l) === id)) problems.push(`NO ANCHOR ${f} -> ${p}${a}`);
      }
    }
  }
  for (const f of mdC.filter((x) => /\.plan\.md$/.test(x))) {
    const t = fs.readFileSync(f, 'utf8');
    const b = path.basename(f).replace('.plan.md', '');
    if (fs.existsSync(f.replace('.plan.md', '.test-plan.md')) && !t.includes(`${b}.test-plan.md`)) problems.push(`MISSING link to test plan: ${f}`);
    if (!fs.readFileSync(path.join(path.dirname(f), 'progress.md'), 'utf8').includes(`${b}.plan.md`)) problems.push(`MISSING progress row link: ${f}`);
  }
  console.log = log0;
  problems.forEach((p) => console.log(p));
  console.log(`${problems.length} link problem(s)`);
  process.exit(problems.length ? 1 : 0);
}
const root = path.resolve(process.argv[2]);
const write = process.argv.includes('--write');
const log = [];

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'audit' || e.name.startsWith('.')) return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

// 1. rename 1-decisions.md / 2-spec.md
const rename = [['1-decisions.md', 'decisions.md'], ['2-spec.md', 'spec.md']];
for (const [a, b] of rename) {
  const pa = path.join(root, a);
  if (fs.existsSync(pa)) {
    log.push(`rename ${a} -> ${b}`);
    if (write) fs.renameSync(pa, path.join(root, b));
  }
}
let files = write ? walk(root) : walk(root).map((p) => p.replace(/1-decisions\.md$/, 'decisions.md'));
files = files.filter((p) => /\.(md|json)$/.test(p) && path.basename(p) !== 'index.md');
const mdFiles = files.filter((p) => p.endsWith('.md'));

const rel = (from, to) => {
  const r = path.relative(path.dirname(from), to);
  return r.startsWith('.') ? r : r;
};
const decisionsPath = path.join(root, 'decisions.md');

// protected segments
const PROT = /(`[^`]*`|\[[^\]]*\]\([^)]*\)|<a id=[^>]*><\/a>|<!--.*?-->|https?:\/\/\S+)/g;

function linkDs(text, file) {
  const target = file === decisionsPath ? '' : rel(file, decisionsPath);
  const mk = (n) => `${target}#d${n}`;
  const lines = text.split('\n');
  let fence = false;
  let fm = lines[0] === '---';
  return lines
    .map((line, i) => {
      if (fm) {
        if (i > 0 && line === '---') fm = false;
        return line;
      }
      if (/^```/.test(line)) {
        fence = !fence;
        return line;
      }
      if (fence) return line;
      let prefix = '';
      let rest = line;
      const def = line.match(/^(- (?:<a id="d\d+"><\/a>)?\*\*D\d+\*\*)(.*)$/);
      if (def) {
        prefix = def[1];
        rest = def[2];
      }
      const parts = rest.split(PROT);
      const out = parts
        .map((seg, j) => {
          if (j % 2 === 1) return seg; // protected
          return seg
            .replace(/\[D(\d{1,3})\]/g, (_, n) => `[D${n}](${mk(n)})`)
            .replace(/(?<![\w\[/#-])D(\d{1,3})\b(?!\]\()/g, (_, n) => `[D${n}](${mk(n)})`);
        })
        .join('');
      return prefix + out;
    })
    .join('\n');
}

// anchors
function decisionAnchors(text) {
  return text
    .split('\n')
    .map((l) => {
      const m = l.match(/^- (?:<a id="d\d+"><\/a>)?\*\*D(\d+)\*\*(.*)$/);
      if (m) return `- <a id="d${m[1]}"></a>**D${m[1]}**${m[2]}`;
      return l;
    })
    .join('\n');
}
function acAnchors(text) {
  const lines = text.split('\n');
  let inAc = false;
  let n = 0;
  return lines
    .map((l) => {
      if (/^\*\*Acceptance criteria\*\*/.test(l)) {
        inAc = true;
        return l;
      }
      if (/^## /.test(l)) inAc = false;
      if (!inAc) return l;
      const stripped = l.replace(/^- <a id="ac-\d+"><\/a>/, '- ');
      if (/^- /.test(stripped)) {
        n++;
        return `- <a id="ac-${n}"></a>${stripped.slice(2)}`;
      }
      return l;
    })
    .join('\n');
}

// nav
const taskDirs = ['tasks', ...(fs.existsSync(path.join(root, 'tasks')) ? fs.readdirSync(path.join(root, 'tasks')).filter((d) => /^issue-/.test(d)).map((d) => `tasks/${d}`) : [])].filter((d) => fs.existsSync(path.join(root, d)) && fs.statSync(path.join(root, d)).isDirectory());
const stepsIn = (dirAbs) => (fs.existsSync(dirAbs) ? fs.readdirSync(dirAbs).filter((f) => /^step-\d+-.*\.plan\.md$/.test(f)).sort((a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])) : []);
const core = [
  ['Index', 'index.md'],
  ['PRD', 'prd.md'],
  ['Decisions', 'decisions.md'],
  ['Spec', 'spec.md'],
  ['Design', 'design.md'],
  ['Progress', taskDirs.map((d) => `${d}/progress.md`).find((f) => fs.existsSync(path.join(root, f))) ?? 'tasks/progress.md'],
].filter(([, f]) => f === 'index.md' || fs.existsSync(path.join(root, f)) || write || f === 'decisions.md');

function navLines(file) {
  const out = [];
  out.push(core.map(([n, f]) => `[${n}](${rel(file, path.join(root, f))})`).join(' · ') + ' <!-- nav -->');
  const base = path.basename(file);
  const m = base.match(/^(step-(\d+)-.*)\.(plan|test-plan)\.md$/);
  if (m) {
    const stepFiles = stepsIn(path.dirname(file));
    const idx = stepFiles.indexOf(`${m[1]}.plan.md`);
    const parts = [`Step ${m[2]}`];
    parts.push(`[Plan](${m[1]}.plan.md)`);
    if (fs.existsSync(path.join(path.dirname(file), `${m[1]}.test-plan.md`))) parts.push(`[Test plan](${m[1]}.test-plan.md)`);
    const nb = (f) => {
      const b2 = f.replace('.plan.md', '');
      const useTp = m[3] === 'test-plan' && fs.existsSync(path.join(path.dirname(file), `${b2}.test-plan.md`));
      return useTp ? `${b2}.test-plan.md` : f;
    };
    if (idx > 0) parts.push(`← [Step ${stepFiles[idx - 1].split('-')[1]}](${nb(stepFiles[idx - 1])})`);
    if (idx >= 0 && idx < stepFiles.length - 1) parts.push(`[Step ${stepFiles[idx + 1].split('-')[1]}](${nb(stepFiles[idx + 1])}) →`);
    const planText = fs.readFileSync(path.join(path.dirname(file), `${m[1]}.plan.md`), 'utf8');
    const dm = planText.match(/^depends_on:\s*\[([^\]]*)\]/m);
    const deps = dm ? dm[1].split(',').map((x) => x.trim()).filter(Boolean) : [];
    const depLinks = deps.map((n) => { const f = stepFiles.find((x) => x.startsWith(`step-${n}-`)); return f ? `[Step ${n}](${f})` : null; }).filter(Boolean);
    if (depLinks.length) parts.push(`Needs: ${depLinks.join(', ')}`);
    out.push(parts.join(' · ') + ' <!-- nav-step -->');
  }
  return out;
}

function applyNav(text, file) {
  const lines = text.split('\n').filter((l) => !/^<!-- nav(-step)? -->/.test(l) && !/ <!-- nav(-step)? -->$/.test(l));
  let at = lines.findIndex((l) => /^# /.test(l));
  // skip front matter for H1 search
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    at = lines.findIndex((l, i) => i > end && /^# /.test(l));
  }
  const ins = navLines(file);
  if (at === -1) {
    while (lines[0] === '') lines.shift();
    lines.unshift(...ins.flatMap((l, i) => (i ? ['', l] : [l])), '');
  } else {
    lines.splice(at + 1, 0, '', ...ins.flatMap((l, i) => (i ? ['', l] : [l])));
    const endAt = at + 2 + (ins.length * 2 - 1);
    if (lines[endAt] !== '') lines.splice(endAt, 0, '');
    while (lines[endAt] === '' && lines[endAt + 1] === '') lines.splice(endAt, 1);
  }
  return lines.join('\n');
}

let changed = 0;
for (const f of files) {
  const orig = f.endsWith('decisions.md') && !write && !fs.existsSync(f) ? fs.readFileSync(path.join(root, '1-decisions.md'), 'utf8') : fs.readFileSync(f, 'utf8');
  let t = orig;
  for (const [a, b] of rename) t = t.split(a).join(b);
  if (f.endsWith('.md')) {
    if (path.basename(f) === 'decisions.md') t = decisionAnchors(t);
    if (path.basename(f) === 'prd.md') t = acAnchors(t);
    t = linkDs(t, f);
    t = applyNav(t, f);
  }
  if (t !== orig) {
    changed++;
    log.push(`edit ${path.relative(root, f)}`);
    if (write) fs.writeFileSync(f, t);
  }
}

// index
const group = (title, list) => (list.length ? `\n## ${title}\n\n${list.map((l) => `- ${l}`).join('\n')}\n` : '');
const lk = (p, label) => `[${label ?? p}](${p})`;
const exist = (p) => fs.existsSync(path.join(root, p)) || (!write && p === 'decisions.md');
const core2 = [['prd.md', 'PRD — acceptance criteria (ac-N)'], ['decisions.md', 'Decisions (D<n>)'], ['spec.md', 'Spec — behavior rules'], ['design.md', 'Design — frames and layout'], [core.find(([n]) => n === 'Progress')[1], 'Progress — step status and AC → step']].filter(([p]) => exist(p)).map(([p, l]) => `${lk(p, l)}`);
const steps = taskDirs.flatMap((d) => stepsIn(path.join(root, d)).map((f) => {
  const n = f.split('-')[1];
  const b = f.replace('.plan.md', '');
  const t = fs.existsSync(path.join(root, d, `${b}.test-plan.md`)) ? ` · ${lk(`${d}/${b}.test-plan.md`, 'test plan')}` : '';
  return `Step ${n}: ${lk(`${d}/${f}`, b.replace(/^step-\d+-/, ''))}${t}`;
}));
const disc = fs.existsSync(path.join(root, 'discovery')) ? fs.readdirSync(path.join(root, 'discovery')).filter((f) => f.endsWith('.md')).sort().map((f) => lk(`discovery/${f}`, f.replace(/\.md$/, ''))) : [];
const imgs = fs.existsSync(path.join(root, 'design')) ? fs.readdirSync(path.join(root, 'design')).sort().map((f) => lk(`design/${f}`, f)) : [];
const audits = fs.existsSync(path.join(root, 'audit')) ? fs.readdirSync(path.join(root, 'audit')).filter((f) => f.startsWith('report-')).sort().map((f) => lk(`audit/${f}`, f)) : [];
const index = `# ${path.basename(root)} — index\n\n<!-- generated by nav script; do not edit by hand -->\n${group('Core', core2)}${group('Steps', steps)}${group('Discovery (proof behind decisions)', disc)}${group('Design images', imgs)}${group('Audit', audits)}`;
const ip = path.join(root, 'index.md');
if (!fs.existsSync(ip) || fs.readFileSync(ip, 'utf8') !== index) {
  log.push('write index.md');
  if (write) fs.writeFileSync(ip, index);
}

console.log(log.join('\n'));
console.log(`${changed} files changed${write ? '' : ' (dry run)'}`);
