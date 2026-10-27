import { matchAny } from './glob.mjs';
import { latestIsOurs } from './markers.mjs';

export const normLogin = (s) => String(s ?? '').toLowerCase().replace(/\[bot\]$/, '');

const LABELS = new Set([
  'praise', 'nitpick', 'nit', 'suggestion', 'issue', 'todo', 'question',
  'thought', 'chore', 'note', 'typo', 'polish',
]);

// Conventional Comments: "<label> [(decorations)]: subject" on the first line.
export function parseSignal(body) {
  const first = String(body ?? '').split('\n').find((l) => l.trim()) ?? '';
  const m = first.match(/^[\s>*_-]*([a-z]+)\s*(?:\(([^)]*)\))?\s*[*_]*\s*:/i);
  if (!m || !LABELS.has(m[1].toLowerCase())) return { label: null, blocking: false };
  const label = m[1].toLowerCase();
  const decos = (m[2] ?? '').toLowerCase().split(',').map((d) => d.trim());
  const blocking = label === 'issue' || label === 'todo' || decos.includes('blocking');
  return { label, blocking };
}

// Strictest signal across all comments (D15): blocking > question > soft > none.
export function strongestSignal(comments) {
  let best = 'none';
  for (const c of comments) {
    const s = parseSignal(c.body);
    if (s.blocking) return 'blocking';
    if (s.label === 'question') best = 'question';
    else if (s.label && best === 'none') best = 'soft';
  }
  return best;
}

// D1/D15: every author except the PR author must be trusted.
export async function evaluateTrust({ comments, prAuthor, config, hasWrite, cache = new Map() }) {
  const untrusted = [];
  const bots = new Set(config.trustedBots.map(normLogin));
  for (const c of comments) {
    const login = normLogin(c.author);
    if (!login || login === normLogin(prAuthor)) continue;
    let ok = cache.get(login);
    if (ok === undefined) {
      ok = c.authorIsBot ? bots.has(login) : await hasWrite(c.author, c);
      cache.set(login, ok);
    }
    if (!ok && !untrusted.includes(login)) untrusted.push(login);
  }
  return { trusted: untrusted.length === 0, untrusted };
}

// Deterministic first pass (design step 2). Model decides kind/category later.
export async function preclassify({ threads, viewer, prAuthor, config, hasWrite }) {
  const cache = new Map();
  const out = {};
  for (const t of threads) {
    if (latestIsOurs(t.comments, viewer, t.id)) {
      out[t.id] = { skipped: true, reason: 'marker' };
      continue;
    }
    const trust = await evaluateTrust({ comments: t.comments, prAuthor, config, hasWrite, cache });
    const signal = strongestSignal(t.comments);
    const reasons = [];
    if (!trust.trusted) reasons.push(`untrusted:${trust.untrusted.join(',')}`);
    if (signal === 'blocking') reasons.push('signal:blocking');
    if (matchAny(config.protectedPaths, t.path)) reasons.push('protected-path');
    if (matchAny(config.gatedPaths, t.path)) reasons.push('gated-path');
    if (t.outdated) reasons.push('outdated');
    const forced = reasons.length > 0;
    out[t.id] = {
      skipped: false,
      trusted: trust.trusted,
      signal,
      category: null,
      gate: forced ? 'gated' : signal === 'question' ? 'question' : null,
      candidate: !forced && signal !== 'question',
      reasons,
      p: null,
      tag: null,
      decision: 'pending',
      commit: null,
      reply: null,
      resolved: false,
      error: null,
    };
  }
  return out;
}

// D3 rule order, after the model's call. cls: { kind: fix|question|outdated, category }.
export function finalizeGate(rec, cls, config) {
  if (rec.gate === 'gated') return 'gated';
  if (cls.kind === 'question') return 'question';
  if (cls.kind === 'fix' && rec.signal === 'question') return 'gated';
  if (cls.kind === 'fix' && rec.candidate && config.autoCategories.includes(cls.category)) return 'auto';
  return 'gated';
}

// Resolve policy (D11). Returns whether the reply kind + gate may resolve the thread.
export function shouldResolve({ policy, kind, gate, authorsAreBots }) {
  if (kind !== 'fixed' && kind !== 'already-addressed') return false;
  if (policy === 'all') return true;
  if (policy === 'auto-and-bots') return gate === 'auto' || authorsAreBots;
  return false;
}
