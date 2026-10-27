#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { parse, runIfMain } from '../lib/cli.mjs';
import { git as realGit } from '../lib/exec.mjs';
import { parseRemote, parsePrUrl, detectProvider } from '../lib/remote.mjs';
import { userConfigFor, mergeConfig, readJsonFile, CONFIG_PATH } from '../lib/config.mjs';
import { makeProvider } from '../lib/provider/index.mjs';
import { loadReview, saveReview, resolveStateDir, excludeFromGit, parseIssue } from '../lib/state.mjs';

const stop = (code, message, extra = {}) => ({ ok: false, stop: code, message, ...extra });

// Step 0: resolve the PR, check the checkout, load config, resolve stateDir.
export async function main(argv, deps = {}) {
  const a = parse(argv, {
    pr: { type: 'string' },
    'state-dir': { type: 'string' },
    'user-config': { type: 'string' },
    'plugin-data': { type: 'string' },
  });
  const git = deps.git ?? realGit;
  const mk = deps.makeProvider ?? makeProvider;
  const repoRoot = git(['rev-parse', '--show-toplevel']).trim();
  const userFile = readJsonFile(a['user-config'] ?? path.join(os.homedir(), '.claude', 'review-threads', 'config.json'));

  // Which PR/MR on which host.
  let target = a.pr ? parsePrUrl(a.pr) : null;
  const remotes = git(['remote']).split(/\s+/).filter(Boolean);
  const remoteName = remotes.includes('origin') ? 'origin' : remotes[0];
  if (!remoteName) return stop('no-remote', 'no git remote configured');
  const remote = parseRemote(git(['remote', 'get-url', remoteName]));
  if (!remote) return stop('bad-remote', 'cannot parse the git remote URL');
  const host = target?.host ?? remote.host;
  const project = target?.project ?? remote.project;
  if (target && (host !== remote.host || project !== remote.project))
    return stop('other-repo', `PR is ${host}/${project}, checkout is ${remote.host}/${remote.project}`);
  const providerName = target?.provider ?? detectProvider(host, userFile?.hosts);
  if (!providerName) return stop('provider-unknown', `set hosts["${host}"] to "github" or "gitlab" in the user config`);

  const user = userConfigFor(userFile, `${host}/${project}`);
  const provider = deps.provider ?? mk(providerName, { host, project });
  const branch = git(['branch', '--show-current']).trim();
  const number = target?.number ?? provider.resolveNumber(a.pr && /^\d+$/.test(a.pr) ? a.pr : null, branch);
  const { pr } = provider.fetchPr(number);

  if (provider.hasPendingDraft(number)) return stop('pending-draft', 'submit or discard your pending review, then re-run');
  if (!pr.pushable) return stop('not-pushable', `PR head is not pushable (${pr.pushableReason})`);
  if (branch !== pr.headRef) return stop('wrong-branch', `check out ${pr.headRef} (on ${branch || 'detached HEAD'})`);
  if (git(['status', '--porcelain']).trim()) return stop('dirty-tree', 'commit or park your changes first');

  // Repo config comes from the BASE branch, never the head (D10).
  git(['fetch', remoteName, pr.baseRef]);
  let repoCfg = null;
  try {
    repoCfg = JSON.parse(git(['show', `${remoteName}/${pr.baseRef}:${CONFIG_PATH}`]));
  } catch {
    repoCfg = null;
  }
  const { config, loosened } = mergeConfig(user, repoCfg);

  let stateDir = a['state-dir'];
  let source = 'arg';
  if (!stateDir) {
    const r = resolveStateDir({
      template: config.stateDir,
      vars: { branch: pr.headRef, pr: String(pr.number), issue: parseIssue(pr.body, pr.headRef) },
      repoRoot,
      pluginData: a['plugin-data'],
      host,
      project,
      pr: pr.number,
    });
    if (r.choose) return stop('state-dir-ambiguous', 'several folders match stateDir; pass --state-dir', { candidates: r.choose });
    stateDir = r.dir;
    source = r.source;
  }
  excludeFromGit(repoRoot, path.resolve(stateDir));

  const viewer = provider.viewer();
  const review = loadReview(stateDir) ?? { version: 1, threads: {} };
  review.run = { provider: providerName, host, project, number: pr.number, remote: remoteName, viewer, headRef: pr.headRef, baseRef: pr.baseRef, prAuthor: pr.author, config };
  saveReview(stateDir, review);
  return { ok: true, stateDir, stateSource: source, pr, viewer, loosened, config };
}

runIfMain(import.meta.url, main);
