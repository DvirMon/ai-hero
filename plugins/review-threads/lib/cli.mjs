import { parseArgs } from 'node:util';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const parse = (argv, options) =>
  parseArgs({ args: argv, options, allowPositionals: false, strict: true }).values;

export const emit = (obj) => process.stdout.write(`${JSON.stringify(obj)}\n`);

const same = (a, b) => {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
};

// Runs main(argv) when the module is the entry point; prints one JSON line.
export async function runIfMain(metaUrl, main) {
  if (!process.argv[1] || !same(fileURLToPath(metaUrl), path.resolve(process.argv[1]))) return;
  try {
    const out = await main(process.argv.slice(2));
    emit(out);
    process.exitCode = out.ok === false ? 1 : 0;
  } catch (e) {
    emit({ ok: false, error: e.message });
    process.exitCode = 1;
  }
}
