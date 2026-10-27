import { readFileSync, existsSync } from 'node:fs';

export const CATEGORIES = ['typo', 'naming', 'unused-import', 'project-rule'];
export const RESOLVE = ['all', 'auto-and-bots', 'none'];
export const CONFIG_PATH = '.claude/review-threads.json';

export const DEFAULTS = {
  fixers: [],
  protectedPaths: [],
  gatedPaths: [],
  autoCategories: ['typo', 'naming', 'unused-import'],
  trustedBots: [],
  resolve: 'auto-and-bots',
  stateDir: null,
  hosts: {},
  projectRuleMaxLines: 12,
  verifyTimeoutMs: 600000,
};

const list = (v, name) => {
  if (v === undefined) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) throw new Error(`config.${name} must be a string array`);
  return v;
};

export function validate(cfg = {}) {
  const out = { ...cfg };
  for (const k of ['protectedPaths', 'gatedPaths', 'autoCategories', 'trustedBots']) out[k] = list(cfg[k], k);
  if (out.autoCategories?.some((c) => !CATEGORIES.includes(c)))
    throw new Error(`config.autoCategories: allowed ${CATEGORIES.join(', ')}`);
  if (cfg.resolve !== undefined && !RESOLVE.includes(cfg.resolve))
    throw new Error(`config.resolve: allowed ${RESOLVE.join(', ')}`);
  if (cfg.fixers !== undefined) {
    if (!Array.isArray(cfg.fixers)) throw new Error('config.fixers must be an array');
    for (const f of cfg.fixers) if (!f || typeof f.glob !== 'string') throw new Error('config.fixers[].glob is required');
  }
  return out;
}

const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const union = (a, b) => [...new Set([...(a ?? []), ...(b ?? [])])];
const intersect = (a, b) => a.filter((x) => b.includes(x));

// User-level file: { defaults?, hosts?, projects?: { "<host>/<project path>": {...} } }
export function userConfigFor(userFile, projectKey) {
  const base = validate(userFile?.defaults ?? {});
  const proj = validate(userFile?.projects?.[projectKey] ?? {});
  return { ...DEFAULTS, ...strip(base), ...strip(proj), hosts: { ...(userFile?.hosts ?? {}) } };
}

// Repo file (read from the PR base branch) may add fixers and only TIGHTEN safety
// fields. resolve/stateDir/hosts are user-level only. Returns { config, loosened }.
export function mergeConfig(user, repoRaw) {
  const repo = validate(repoRaw ?? {});
  const loosened = [];
  const out = { ...user };
  out.fixers = [...(repo.fixers ?? []), ...user.fixers];
  out.protectedPaths = union(union(user.protectedPaths, repo.protectedPaths), [CONFIG_PATH]);
  out.gatedPaths = union(user.gatedPaths, repo.gatedPaths);
  if (repo.autoCategories) {
    out.autoCategories = intersect(user.autoCategories, repo.autoCategories);
    if (repo.autoCategories.some((c) => !user.autoCategories.includes(c))) loosened.push('autoCategories');
  }
  if (repo.trustedBots) {
    out.trustedBots = intersect(user.trustedBots, repo.trustedBots);
    if (repo.trustedBots.some((b) => !user.trustedBots.includes(b))) loosened.push('trustedBots');
  }
  for (const k of ['resolve', 'stateDir', 'hosts']) if (repoRaw && repoRaw[k] !== undefined) loosened.push(k);
  return { config: out, loosened };
}

export function readJsonFile(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

// First fixer whose glob matches wins.
export const fixerFor = (config, file, matchGlob) => config.fixers.find((f) => matchGlob(f.glob, file)) ?? null;
