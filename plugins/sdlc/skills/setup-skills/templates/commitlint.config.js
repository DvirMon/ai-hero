// Emoji conventional commits: `<emoji> <type>(<scope>): <subject>`.
// The emoji is optional so plain conventional headers still pass.
// Rename to commitlint.config.cjs when package.json has "type": "module".
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(?:\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*\s+)?(\w+)(?:\(([^)]+)\))?!?: (.+)$/u,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
};
