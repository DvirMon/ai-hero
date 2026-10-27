import { run as exec } from '../exec.mjs';

// GitHub adapter over `gh api`. `runner(args)` returns stdout; injectable for tests.
// Thread/comment fields: docs.github.com/en/graphql/reference/pulls. Reply goes over
// REST (never the GraphQL reply mutation), as ce-resolve-pr-feedback does.

const THREAD_FIELDS = `
  id isResolved isOutdated path line originalLine subjectType
  comments(first: 100) {
    pageInfo { hasNextPage endCursor }
    nodes { id fullDatabaseId body createdAt url author { __typename login } }
  }`;

const PR_QUERY = `
query($owner: String!, $name: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $name) {
    viewerPermission
    pullRequest(number: $number) {
      id number isDraft body headRefName headRefOid baseRefName
      isCrossRepository maintainerCanModify
      author { login }
      reviewThreads(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { ${THREAD_FIELDS} }
      }
    }
  }
}`;

const MORE_COMMENTS = `
query($id: ID!, $after: String) {
  node(id: $id) {
    ... on PullRequestReviewThread {
      comments(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { id fullDatabaseId body createdAt url author { __typename login } }
      }
    }
  }
}`;

const PENDING_QUERY = `
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) { reviews(first: 10, states: [PENDING]) { totalCount } }
  }
}`;

const ISSUE_COMMENTS = `
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      comments(last: 100) { nodes { url author { __typename login } } }
      reviews(last: 100) { nodes { url body state author { __typename login } } }
    }
  }
}`;

export function createGithub({ host, project, runner }) {
  const [owner, name] = [project.split('/')[0], project.split('/').slice(1).join('/')];
  const hostArgs = host && host !== 'github.com' ? ['--hostname', host] : [];
  const api = (args) => runner(['api', ...hostArgs, ...args]);
  const gql = (query, vars = {}) => {
    const args = ['graphql', '-f', `query=${query}`];
    for (const [k, v] of Object.entries(vars)) if (v != null) args.push(typeof v === 'number' ? '-F' : '-f', `${k}=${v}`);
    const res = JSON.parse(api(args));
    if (res.errors?.length) throw new Error(`graphql: ${res.errors.map((e) => e.message).join('; ')}`);
    return res.data;
  };

  const mapComment = (c) => ({
    id: c.id,
    restId: c.fullDatabaseId == null ? null : String(c.fullDatabaseId),
    author: c.author?.login ?? 'ghost',
    authorIsBot: c.author?.__typename === 'Bot' || /\[bot\]$/.test(c.author?.login ?? ''),
    body: c.body ?? '',
    createdAt: c.createdAt,
    url: c.url,
  });

  const allComments = (thread) => {
    const nodes = [...thread.comments.nodes];
    let info = thread.comments.pageInfo;
    while (info?.hasNextPage) {
      const data = gql(MORE_COMMENTS, { id: thread.id, after: info.endCursor });
      nodes.push(...data.node.comments.nodes);
      info = data.node.comments.pageInfo;
    }
    return nodes.map(mapComment);
  };

  return {
    name: 'github',
    host,
    project,

    viewer() {
      return JSON.parse(api(['user'])).login;
    },

    // Number from arg, else the PR for the current branch.
    resolveNumber(number) {
      if (number) return Number(number);
      return JSON.parse(runner(['pr', 'view', '--json', 'number'])).number;
    },

    // Threads fully paginated (threads and nested comments); resolved ones dropped.
    fetchPr(number) {
      const threads = [];
      let after = null;
      let pr = null;
      let viewerPermission = null;
      do {
        const data = gql(PR_QUERY, { owner, name, number: Number(number), after });
        const r = data.repository;
        viewerPermission = r.viewerPermission;
        pr = r.pullRequest;
        for (const t of pr.reviewThreads.nodes) {
          if (t.isResolved) continue;
          const comments = allComments(t);
          threads.push({
            id: t.id,
            replyKey: comments[0]?.restId ?? null,
            path: t.path,
            line: t.line ?? t.originalLine ?? null,
            outdated: !!t.isOutdated,
            fileLevel: t.subjectType === 'FILE',
            authors: [...new Set(comments.map((c) => c.author))],
            comments,
          });
        }
        after = pr.reviewThreads.pageInfo.hasNextPage ? pr.reviewThreads.pageInfo.endCursor : null;
      } while (after);
      const canPush = ['WRITE', 'MAINTAIN', 'ADMIN'].includes(viewerPermission);
      return {
        pr: {
          provider: 'github', host, project, number: pr.number,
          headSha: pr.headRefOid, headRef: pr.headRefName, baseRef: pr.baseRefName,
          author: pr.author?.login ?? null, body: pr.body ?? '', draft: pr.isDraft,
          // D16: a fork head is not pushable from the base repo's permission.
          pushable: !pr.isCrossRepository && canPush,
          pushableReason: pr.isCrossRepository ? 'fork PR' : canPush ? null : `permission ${viewerPermission ?? 'unknown'}`,
        },
        threads,
      };
    },

    // Non-thread comments for the end-of-run summary (D13). Read-only.
    fetchNonThread(number) {
      const pr = gql(ISSUE_COMMENTS, { owner, name, number: Number(number) }).repository.pullRequest;
      const out = [];
      for (const c of pr.comments.nodes) out.push({ kind: 'conversation', url: c.url, author: c.author?.login ?? 'ghost' });
      for (const r of pr.reviews.nodes)
        if (r.body?.trim()) out.push({ kind: 'review-summary', url: r.url, author: r.author?.login ?? 'ghost' });
      return out;
    },

    // Pending (unsubmitted) review of the viewer blocks the run (D8).
    hasPendingDraft(number) {
      const d = gql(PENDING_QUERY, { owner, name, number: Number(number) });
      return d.repository.pullRequest.reviews.totalCount > 0;
    },

    // Write access via the permission endpoint; role_name carries maintain/triage.
    hasWrite(login) {
      try {
        const r = JSON.parse(api([`repos/${owner}/${name}/collaborators/${login}/permission`]));
        return ['admin', 'maintain', 'write'].includes(r.role_name) || ['admin', 'write'].includes(r.permission);
      } catch {
        return false;
      }
    },

    // Re-reads one thread's comments (marker idempotency check before posting).
    threadComments(_number, threadId) {
      let nodes = [];
      let after = null;
      let info;
      do {
        const d = gql(MORE_COMMENTS, { id: threadId, after });
        nodes = nodes.concat(d.node.comments.nodes);
        info = d.node.comments.pageInfo;
        after = info.hasNextPage ? info.endCursor : null;
      } while (after);
      return nodes.map(mapComment);
    },

    reply(thread, number, body) {
      if (!thread.replyKey) throw new Error('thread has no REST comment id');
      const r = JSON.parse(
        api([`repos/${owner}/${name}/pulls/${number}/comments/${thread.replyKey}/replies`, '-X', 'POST', '-f', `body=${body}`]),
      );
      return { id: r.node_id ?? String(r.id), url: r.html_url };
    },

    resolve(_number, threadId) {
      gql('mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { isResolved } } }', { id: threadId });
    },

    // POST .../requested_reviewers/rerequest exists in the REST docs.
    rerequest(number, logins, _ids) {
      if (!logins.length) return { supported: true, requested: [] };
      api([`repos/${owner}/${name}/pulls/${number}/requested_reviewers/rerequest`, '-X', 'POST',
        ...logins.flatMap((l) => ['-f', `reviewers[]=${l}`])]);
      return { supported: true, requested: logins };
    },
  };
}

export const ghRunner = (args) => exec('gh', args);
