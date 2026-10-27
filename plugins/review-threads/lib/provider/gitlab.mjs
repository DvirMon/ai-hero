import { run as exec } from '../exec.mjs';

// GitLab adapter over `glab api` (REST v4). `runner(args)` returns stdout.
// Docs: docs.gitlab.com/api/discussions, /merge_requests, /project_members, /draft_notes.
// Pagination is manual (per_page + page): glab's --paginate output shape is not documented.

const PER_PAGE = 100;
const DEVELOPER = 30;

// UNVERIFIED: GitLab documents no bot flag on discussion-note authors. Heuristic only;
// real trust for bots still needs the login in config.trustedBots.
const BOT_NAME = /(^|[_-])bot$|^(project|group)_\d+_bot/i;

export function createGitlab({ host, project, runner }) {
  const pid = encodeURIComponent(project);
  const hostArgs = host && host !== 'gitlab.com' ? ['--hostname', host] : [];
  const api = (args) => runner(['api', ...hostArgs, ...args]);
  const get = (p) => JSON.parse(api([p]));

  const getAll = (p) => {
    const out = [];
    for (let page = 1; ; page++) {
      const sep = p.includes('?') ? '&' : '?';
      const rows = get(`${p}${sep}per_page=${PER_PAGE}&page=${page}`);
      out.push(...rows);
      if (rows.length < PER_PAGE) return out;
    }
  };

  const mapNote = (n) => ({
    id: String(n.id),
    author: n.author?.username ?? 'ghost',
    authorId: n.author?.id ?? null,
    authorIsBot: BOT_NAME.test(n.author?.username ?? ''),
    body: n.body ?? '',
    createdAt: n.created_at,
    url: null,
  });

  const mrPath = (iid) => `projects/${pid}/merge_requests/${iid}`;
  let viewerCache = null;

  return {
    name: 'gitlab',
    host,
    project,

    viewer() {
      viewerCache ??= get('user');
      return viewerCache.username;
    },

    resolveNumber(number, branch) {
      if (number) return Number(number);
      const rows = get(`projects/${pid}/merge_requests?source_branch=${encodeURIComponent(branch)}&state=opened`);
      if (rows.length !== 1) throw new Error(rows.length ? 'several open MRs for this branch; pass the MR number' : 'no open MR for this branch');
      return rows[0].iid;
    },

    fetchPr(iid) {
      const mr = get(mrPath(iid));
      const discussions = getAll(`${mrPath(iid)}/discussions`);
      const headSha = mr.diff_refs?.head_sha ?? mr.sha;
      const threads = [];
      for (const d of discussions) {
        const first = d.notes?.[0];
        if (d.individual_note || !first || first.type !== 'DiffNote') continue;
        const resolvable = d.notes.filter((n) => n.resolvable && !n.system);
        if (resolvable.length && resolvable.every((n) => n.resolved)) continue;
        const comments = d.notes.filter((n) => !n.system).map(mapNote);
        const pos = first.position ?? {};
        threads.push({
          id: d.id,
          replyKey: d.id,
          path: pos.new_path ?? pos.old_path ?? null,
          line: pos.new_line ?? pos.old_line ?? null,
          // UNVERIFIED: no documented outdated flag. staleAnchor is informational only.
          outdated: false,
          staleAnchor: !!pos.head_sha && !!headSha && pos.head_sha !== headSha,
          fileLevel: pos.position_type === 'file',
          authors: [...new Set(comments.map((c) => c.author))],
          comments,
        });
      }
      let canPush = false;
      const sameProject = mr.source_project_id === mr.target_project_id;
      if (sameProject) canPush = this.accessLevel(this.viewerId()) >= DEVELOPER;
      return {
        pr: {
          provider: 'gitlab', host, project, number: mr.iid,
          headSha: mr.sha, headRef: mr.source_branch, baseRef: mr.target_branch,
          author: mr.author?.username ?? null, body: mr.description ?? '', draft: !!mr.draft,
          pushable: sameProject && canPush,
          pushableReason: !sameProject ? 'fork MR' : canPush ? null : 'below Developer role',
        },
        threads,
      };
    },

    fetchNonThread(iid) {
      return getAll(`${mrPath(iid)}/discussions`)
        .filter((d) => d.individual_note && d.notes?.[0] && !d.notes[0].system)
        .map((d) => ({ kind: 'conversation', url: null, author: d.notes[0].author?.username ?? 'ghost', id: d.id }));
    },

    // Draft notes are visible only to their author, so any row is the viewer's (D8).
    hasPendingDraft(iid) {
      return get(`${mrPath(iid)}/draft_notes`).length > 0;
    },

    viewerId() {
      viewerCache ??= get('user');
      return viewerCache.id;
    },

    accessLevel(userId) {
      try {
        return get(`projects/${pid}/members/all/${userId}`).access_level ?? 0;
      } catch {
        return 0;
      }
    },

    hasWrite(_login, comment) {
      return comment?.authorId != null && this.accessLevel(comment.authorId) >= DEVELOPER;
    },

    threadComments(iid, discussionId) {
      const d = get(`${mrPath(iid)}/discussions/${discussionId}`);
      return d.notes.filter((n) => !n.system).map(mapNote);
    },

    reply(thread, iid, body) {
      const n = JSON.parse(api([`${mrPath(iid)}/discussions/${thread.id}/notes`, '-X', 'POST', '-f', `body=${body}`]));
      return { id: String(n.id), url: null };
    },

    resolve(iid, threadId) {
      api([`${mrPath(iid)}/discussions/${threadId}`, '-X', 'PUT', '-F', 'resolved=true']);
    },

    // GraphQL mergeRequestReviewerRereview(iid, projectPath, userId); input fields
    // verified in the mutations reference. Needs numeric user ids.
    rerequest(iid, logins, idsByLogin = {}) {
      const requested = [];
      for (const login of logins) {
        const id = idsByLogin[login];
        if (id == null) continue;
        const query = 'mutation($iid: String!, $path: ID!, $uid: UserID!) { mergeRequestReviewerRereview(input: {iid: $iid, projectPath: $path, userId: $uid}) { errors } }';
        const res = JSON.parse(api(['graphql', '-f', `query=${query}`, '-F', `iid=${iid}`, '-f', `path=${project}`, '-f', `uid=gid://gitlab/User/${id}`]));
        if (res.errors?.length || res.data?.mergeRequestReviewerRereview?.errors?.length) throw new Error('rereview failed');
        requested.push(login);
      }
      return { supported: true, requested };
    },
  };
}

export const glabRunner = (args) => exec('glab', args);
