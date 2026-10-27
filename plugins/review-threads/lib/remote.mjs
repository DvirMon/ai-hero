// Parses a git remote URL into { host, project }. project keeps GitLab subgroups.
export function parseRemote(raw) {
  const s = String(raw ?? '').trim();
  let host;
  let p;
  if (/^[a-z+]+:\/\//i.test(s)) {
    const u = new URL(s);
    host = u.hostname;
    p = u.pathname;
  } else {
    const m = s.match(/^(?:[^@]+@)?([^:]+):(.+)$/);
    if (!m) return null;
    host = m[1];
    p = m[2];
  }
  p = p.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\.git$/, '');
  return p ? { host: host.toLowerCase(), project: p } : null;
}

// Parses a PR/MR web URL.
export function parsePrUrl(raw) {
  let u;
  try {
    u = new URL(String(raw).trim());
  } catch {
    return null;
  }
  let m = u.pathname.match(/^\/(.+?)\/-\/merge_requests\/(\d+)/);
  if (m) return { provider: 'gitlab', host: u.hostname.toLowerCase(), project: m[1], number: Number(m[2]) };
  m = u.pathname.match(/^\/(.+?)\/pull\/(\d+)/);
  if (m) return { provider: 'github', host: u.hostname.toLowerCase(), project: m[1], number: Number(m[2]) };
  return null;
}

// Provider from config.hosts, then well-known hostnames. null = ask the user.
// No network probe: GitLab's /version is only documented with a token.
export function detectProvider(host, hostsMap = {}) {
  if (hostsMap[host]) return hostsMap[host];
  if (host === 'github.com' || host.endsWith('.ghe.com')) return 'github';
  if (host === 'gitlab.com' || /(^|\.)gitlab\./.test(host)) return 'gitlab';
  return null;
}
