import { normLogin } from './triage.mjs';

export const buildMarker = (threadId, decision) =>
  `<!-- review-threads:v1 thread=${threadId} decision=${decision} -->`;

const RE = /<!--\s*review-threads:v1\s+thread=(\S+)\s+decision=([a-z-]+)\s*-->/g;

export function parseMarkers(body) {
  return [...String(body ?? '').matchAll(RE)].map((m) => ({ thread: m[1], decision: m[2] }));
}

// A marker only counts when the viewer wrote the comment; anyone can paste one.
export const isOurs = (comment, viewer, threadId, decision) =>
  normLogin(comment.author) === normLogin(viewer) &&
  parseMarkers(comment.body).some(
    (m) => m.thread === threadId && (decision === undefined || m.decision === decision),
  );

// Idempotency: has this run (or an earlier one) already posted this reply?
export const findOurReply = (comments, viewer, threadId, decision) =>
  comments.find((c) => isOurs(c, viewer, threadId, decision)) ?? null;

// Re-run skip rule (D9): the thread's latest comment is our marked reply.
export function latestIsOurs(comments, viewer, threadId) {
  if (!comments.length) return false;
  const last = [...comments].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).at(-1);
  return isOurs(last, viewer, threadId);
}
