// How long a User Audit Session lasted, worded the same on the User Audit page
// and in its PDF and CSV exports.

import type { UserAuditSession } from '@/app/api/lib/modules/audit-log/schemas/user-audit-schema';

/** `2 h 14 min`, `45 min`, `3 d 4 h`; under a minute reads `< 1 min`. Null for a negative span. */
export function formatDuration(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return null;

  const totalMinutes = Math.floor(milliseconds / 60_000);

  if (totalMinutes < 1) return '< 1 min';

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

/**
 * How long a Session lasted: sign-in to its end, or to now while it is still active.
 * Null when the end is unknown (an expired Session whose record is gone).
 */
export function sessionDuration(
  session: Pick<UserAuditSession, 'signedInAt' | 'endedAt' | 'status'>,
  now: Date
) {
  const start = new Date(session.signedInAt).getTime();
  const end =
    session.status === 'active'
      ? now.getTime()
      : session.endedAt
        ? new Date(session.endedAt).getTime()
        : null;

  return end === null ? null : formatDuration(end - start);
}
