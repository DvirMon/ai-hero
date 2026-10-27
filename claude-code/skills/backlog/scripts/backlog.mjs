import { execFileSync } from 'node:child_process';

const RUNGS = ['ready-for-agent', 'needs:tasks', 'needs:grill', 'needs:triage'];
const QUERY = `query($cursor: String) {
  repository(owner: "{owner}", name: "{name}") {
    issues(states: OPEN, first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number title body
        labels(first: 20) { nodes { name } }
        parent { number }
      }
    }
  }
}`;

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

function fetchIssues() {
  const { owner, name } = JSON.parse(
    gh(['repo', 'view', '--json', 'owner,name', '--jq', '{owner: .owner.login, name: .name}']),
  );
  const query = QUERY.replace('{owner}', owner).replace('{name}', name);
  const issues = [];
  let cursor = null;
  for (;;) {
    const args = ['api', 'graphql', '-f', `query=${query}`];
    if (cursor) args.push('-F', `cursor=${cursor}`);
    const { issues: page } = JSON.parse(gh(args)).data.repository;
    issues.push(...page.nodes.map(toIssue));
    if (!page.pageInfo.hasNextPage) return issues;
    cursor = page.pageInfo.endCursor;
  }
}

function toIssue(node) {
  const labels = node.labels.nodes.map((l) => l.name);
  const rung = RUNGS.findIndex((r) => labels.includes(r));
  return {
    number: node.number,
    title: node.title,
    labels,
    parent: node.parent?.number ?? null,
    rung: rung === -1 ? RUNGS.length : rung,
    isEpic: labels.includes('kind:epic'),
    gist: toGist(node.body),
    areas: labels.filter((l) => l.startsWith('area:')).map((l) => l.slice(5)),
  };
}

function toGist(body) {
  const text = (body ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^#+\s.*$/gm, '')
    .replace(/[`*_>|\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 280 ? `${text.slice(0, 280)}…` : text;
}

function describeRung(issue) {
  return RUNGS[issue.rung] ?? 'unlabeled';
}

function renderTable(rows) {
  const lines = ['| # | state | areas | title | gist |', '|---|---|---|---|---|'];
  for (const i of rows) {
    lines.push(`| #${i.number} | ${describeRung(i)} | ${i.areas.join(', ')} | ${i.title} | ${i.gist} |`);
  }
  return lines.join('\n');
}

const byRung = (a, b) => a.rung - b.rung || a.number - b.number;

const issues = fetchIssues();
const numbers = new Set(issues.map((i) => i.number));
const childrenOf = (n) => issues.filter((i) => i.parent === n);
const epics = issues.filter((i) => i.isEpic || childrenOf(i.number).length > 0);
const epicNumbers = new Set(epics.map((e) => e.number));
const standalone = issues
  .filter((i) => !epicNumbers.has(i.number))
  .filter((i) => i.parent === null || !numbers.has(i.parent))
  .sort(byRung);

const bestRung = (e) => Math.min(e.rung, ...childrenOf(e.number).map((c) => c.rung));
const isInProgress = (e) => e.labels.includes('in-progress');
const orderedEpics = [...epics].sort(
  (a, b) => Number(isInProgress(b)) - Number(isInProgress(a)) || bestRung(a) - bestRung(b) || a.number - b.number,
);

console.log(`# Open issues: ${issues.length}\n`);
for (const e of orderedEpics) {
  const kids = childrenOf(e.number).sort(byRung);
  const tag = isInProgress(e) ? 'in-progress' : describeRung(e);
  console.log(`## Epic #${e.number} — ${e.title} (${tag}, ${kids.length} open sub-issues)\n`);
  if (kids.length) console.log(`${renderTable(kids)}\n`);
}
if (standalone.length) console.log(`## Standalone\n\n${renderTable(standalone)}`);
