#!/usr/bin/env node
// Usage: view.mjs <checks|findings|evidence|verdicts> <json...> [--severity migrate|fix|info] [--gate 1|2|3]
// One short line per item, so the main session never reads the raw JSON.
import { read } from './lib.mjs';

const [mode, ...rest] = process.argv.slice(2);
const flag = (n) => (rest.includes(n) ? rest[rest.indexOf(n) + 1] : null);
const files = rest.filter((a, i) => !a.startsWith('--') && !rest[i - 1]?.startsWith('--'));
const load = (f) => JSON.parse(read(f) ?? 'null');
const p = (s) => process.stdout.write(s + '\n');

if (mode === 'checks') {
  const s = load(files[0]);
  const sev = flag('--severity');
  p(`${s.workspace} · ${JSON.stringify(s.counts)}`);
  s.checks.filter((c) => !sev || c.severity === sev)
    .forEach((c, i) => p(`${i + 1}. [${c.severity}] ${c.id} · ${c.msg}${c.file ? ` · ${c.file}${c.line ? `:${c.line}` : ''}` : ''}`));
} else if (mode === 'findings') {
  const a = load(files[0]);
  const gate = flag('--gate');
  a.findings.filter((f) => !gate || String(f.gate) === gate)
    .forEach((f, i) => p(`${i + 1}. G${f.gate} ${f.kind} ${f.key} · local: ${f.local ?? '—'} · tracker: ${f.remote ?? '—'} · ${f.note}`));
} else if (mode === 'evidence') {
  const g = load(files[0]);
  p(`${g.branch} vs ${g.base} · ${g.changedCount} files · ${g.commitCount} commits · ${g.specsToRun.length} specs`);
  g.steps.forEach((s) => p(`step ${s.step} · touched ${s.signal1_files.touched.length} missing ${s.signal1_files.missing.length} dirty ${s.signal1_files.uncommitted.length} · commit ${s.signal2_commits.exact.map((c) => c.sha).join(',') || '—'} · specs ${s.signal3_specs.length}`));
} else if (mode === 'verdicts') {
  for (const f of files) {
    for (const s of load(f)?.steps ?? []) {
      const flips = s.boxes.filter((b) => b.should !== null && b.should !== b.checked).length;
      p(`step ${s.step} · ${s.verdict} (${s.fixSide}) · box flips ${flips} · ACs ${s.acs.map((a) => a.verdict).join('/') || '—'} · gaps: ${s.gaps.join('; ') || '—'}`);
    }
  }
} else {
  console.error('usage: view.mjs <checks|findings|evidence|verdicts> <json...>');
  process.exit(2);
}
