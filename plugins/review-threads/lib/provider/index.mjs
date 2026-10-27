import { createGithub, ghRunner } from './github.mjs';
import { createGitlab, glabRunner } from './gitlab.mjs';

// One interface, two adapters: viewer, resolveNumber, fetchPr, fetchNonThread,
// hasPendingDraft, hasWrite, threadComments(number, id), reply(thread, number, body),
// resolve(number, id), rerequest(number, logins, idsByLogin).
export function makeProvider(name, { host, project, runner }) {
  if (name === 'github') return createGithub({ host, project, runner: runner ?? ghRunner });
  if (name === 'gitlab') return createGitlab({ host, project, runner: runner ?? glabRunner });
  throw new Error(`unknown provider ${name}`);
}
