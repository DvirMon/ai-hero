#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const DIM = '\x1b[2m', RESET = '\x1b[0m';
const CYAN = '\x1b[36m', MAGENTA = '\x1b[35m', YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m', RED = '\x1b[31m', BLUE = '\x1b[34m';

function readStdin() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8')); } catch { return {}; }
}

function git(args, cwd) {
  try {
    return execSync('git ' + args, {
      cwd, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8',
    }).trim();
  } catch { return ''; }
}

function contextLimit(modelId) {
  return /\[1m\]|-1m\b/.test(modelId || '') ? 1000000 : 200000;
}

/**
 * Last main-chain assistant usage = current context size; summed usage across
 * every assistant entry (sidechains included) = session in/out totals.
 */
function readUsage(transcriptPath) {
  const result = { ctx: 0, totalIn: 0, totalOut: 0 };
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return result;
  let lines;
  try { lines = fs.readFileSync(transcriptPath, 'utf8').split('\n'); } catch { return result; }
  let latestFound = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    if (entry.type !== 'assistant') continue;
    const u = entry.message && entry.message.usage;
    if (!u) continue;
    const inTok = (u.input_tokens || 0)
      + (u.cache_creation_input_tokens || 0)
      + (u.cache_read_input_tokens || 0);
    const outTok = u.output_tokens || 0;
    result.totalIn += inTok;
    result.totalOut += outTok;
    if (!latestFound && !entry.isSidechain) {
      result.ctx = inTok + outTok;
      latestFound = true;
    }
  }
  return result;
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return String(n);
}

function pctColor(pct) {
  if (pct >= 85) return RED;
  if (pct >= 60) return YELLOW;
  return GREEN;
}

const data = readStdin();
const cwd = (data.workspace && data.workspace.current_dir) || data.cwd || process.cwd();
const modelName = (data.model && data.model.display_name) || 'claude';
const modelId = (data.model && data.model.id) || '';

const branch = git('rev-parse --abbrev-ref HEAD', cwd);
const isDirty = branch ? git('status --porcelain', cwd).length > 0 : false;

// Prefer the harness-reported context_window block (its context_window_size
// correctly reflects a 1M-token session even though data.model.id never
// carries a "[1m]"/"-1m" marker) — fall back to the transcript-derived
// heuristic only when that block is absent (older CLI versions).
const cw = data.context_window;
let ctx, totalIn, totalOut, limit, pct;
if (cw && typeof cw.context_window_size === 'number') {
  limit = cw.context_window_size;
  ctx = (cw.total_input_tokens || 0) + (cw.total_output_tokens || 0);
  totalIn = cw.total_input_tokens || 0;
  totalOut = cw.total_output_tokens || 0;
  pct = typeof cw.used_percentage === 'number'
    ? Math.min(100, Math.round(cw.used_percentage))
    : Math.min(100, Math.round((ctx / limit) * 100));
} else {
  limit = contextLimit(modelId);
  ({ ctx, totalIn, totalOut } = readUsage(data.transcript_path));
  pct = Math.min(100, Math.round((ctx / limit) * 100));
}

const segments = [];
if (branch) segments.push(`${MAGENTA}⎇ ${branch}${isDirty ? '*' : ''}${RESET}`);
segments.push(`${BLUE}${modelName}${RESET}`);
if (ctx) segments.push(`${pctColor(pct)}${pct}% ctx${RESET} ${DIM}(${fmt(ctx)}/${fmt(limit)})${RESET}`);
if (totalIn || totalOut) {
  segments.push(`${CYAN}↑${fmt(totalIn)}${RESET} ${YELLOW}↓${fmt(totalOut)}${RESET}`);
}

process.stdout.write(segments.join(`${DIM} | ${RESET}`));
