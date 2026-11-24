import type { UserAuditSession } from '../schemas/user-audit-schema';

export type SessionSignIn = {
  sessionId: string;
  occurredOn: Date;
  ipAddress: string | null;
  userAgent: string | null;
  rememberMe: boolean | null;
};

/** A sign-out or a revoke: either names one Session (entityId) or lists several. */
export type SessionEndEvent = {
  action: string;
  occurredOn: Date;
  entityId: string | null;
  sessionIds: string[];
  reason: string | null;
  actorName: string;
  actorUserId: string | null;
};

export type SessionActivity = { sessionId: string; actionCount: number; lastActivityAt: Date };

export type LiveSession = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

function endsSession(event: SessionEndEvent, sessionId: string) {
  return event.entityId === sessionId || event.sessionIds.includes(sessionId);
}

function endReason(event: SessionEndEvent, userId: string) {
  if (event.action === 'auth.sign-out') return event.reason ?? 'Signed out';
  if (event.action === 'user.sessions-revoke' && event.actorUserId !== userId) {
    return `Ended by ${event.actorName}`;
  }
  return 'Ended from another of their Sessions';
}

/**
 * Pieces each Session together from what the Audit Log and the live Session store
 * know: its sign-in, the first sign-out or revoke that names it, the actions taken
 * in it, and whether it is still live. A Session that is neither live nor ended
 * by an event ran out on its own, so it is reported as expired. Live Sessions with
 * no recorded sign-in (started before tracking, or at signup) are included too.
 */
export function buildUserSessions({
  userId,
  now,
  signIns,
  endEvents,
  activity,
  liveSessions,
}: {
  userId: string;
  now: Date;
  signIns: SessionSignIn[];
  endEvents: SessionEndEvent[];
  activity: SessionActivity[];
  liveSessions: LiveSession[];
}): UserAuditSession[] {
  const activityById = new Map(activity.map((item) => [item.sessionId, item]));
  const liveById = new Map(liveSessions.map((live) => [live.id, live]));
  const chronologicalEnds = [...endEvents].sort(
    (a, b) => a.occurredOn.getTime() - b.occurredOn.getTime()
  );

  const recorded = signIns.map((signIn): UserAuditSession => {
    const live = liveById.get(signIn.sessionId);
    const isLive = live !== undefined && live.expiresAt > now;
    const end = chronologicalEnds.find(
      (event) => event.occurredOn >= signIn.occurredOn && endsSession(event, signIn.sessionId)
    );
    const sessionActivity = activityById.get(signIn.sessionId);

    const base = {
      sessionId: signIn.sessionId,
      signedInAt: signIn.occurredOn,
      expiresAt: live?.expiresAt ?? null,
      lastActivityAt: sessionActivity?.lastActivityAt ?? null,
      actionCount: sessionActivity?.actionCount ?? 0,
      ipAddress: signIn.ipAddress,
      userAgent: signIn.userAgent,
      rememberMe: signIn.rememberMe,
      signInRecorded: true,
    };

    if (end && !isLive) {
      return {
        ...base,
        endedAt: end.occurredOn,
        status: end.action === 'auth.sign-out' ? 'signed-out' : 'revoked',
        endReason: endReason(end, userId),
      };
    }

    if (isLive) {
      return { ...base, endedAt: null, status: 'active', endReason: null };
    }

    return {
      ...base,
      endedAt: live?.expiresAt ?? null,
      status: 'expired',
      endReason: 'Expired without signing out',
    };
  });

  const recordedIds = new Set(signIns.map(({ sessionId }) => sessionId));
  const untracked = liveSessions
    .filter((live) => !recordedIds.has(live.id) && live.expiresAt > now)
    .map((live): UserAuditSession => {
      const sessionActivity = activityById.get(live.id);
      return {
        sessionId: live.id,
        signedInAt: live.createdAt,
        endedAt: null,
        status: 'active',
        endReason: null,
        expiresAt: live.expiresAt,
        lastActivityAt: sessionActivity?.lastActivityAt ?? null,
        actionCount: sessionActivity?.actionCount ?? 0,
        ipAddress: live.ipAddress,
        userAgent: live.userAgent,
        rememberMe: null,
        signInRecorded: false,
      };
    });

  return [...recorded, ...untracked].sort(
    (a, b) => b.signedInAt.getTime() - a.signedInAt.getTime()
  );
}
