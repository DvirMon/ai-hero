import { execFileSync, execSync } from 'node:child_process';

// Runs a binary without a shell. Throws an Error carrying stderr/stdout/status.
export function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      ...opts,
    });
  } catch (e) {
    const stderr = String(e.stderr ?? '');
    const err = new Error(`${cmd} ${args.slice(0, 3).join(' ')} failed: ${(stderr || e.message).trim()}`);
    err.stderr = stderr;
    err.stdout = String(e.stdout ?? '');
    err.status = e.status;
    throw err;
  }
}

export const git = (args, opts) => run('git', args, opts);

// Runs a configured verify command through the shell.
export function shell(command, opts = {}) {
  try {
    const out = execSync(command, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      ...opts,
    });
    return { ok: true, output: out };
  } catch (e) {
    return { ok: false, output: `${e.stdout ?? ''}${e.stderr ?? ''}`.trim() || e.message };
  }
}
