import { describe, expect, it } from 'vitest';

import { buildUserSessions, type SessionEndEvent, type SessionSignIn } from './build-user-sessions';

const now = new Date('2026-11-22T12:00:00Z');
const at = (iso: string) => new Date(iso);

const signIn = (sessionId: string, iso: string): SessionSignIn => ({
  sessionId,
  occurredOn: at(iso),
  ipAddress: '10.0.0.5',
  userAgent: 'Mozilla/5.0',
  rememberMe: false,
});

const end = (overrides: Partial<SessionEndEvent>): SessionEndEvent => ({
  action: 'auth.sign-out',
  occurredOn: at('2026-11-22T10:00:00Z'),
  entityId: null,
  sessionIds: [],
  reason: null,
  actorName: 'Dr. Sara Ali',
  actorUserId: 'user-1',
  ...overrides,
});

const build = (input: Partial<Parameters<typeof buildUserSessions>[0]>) =>
  buildUserSessions({
    userId: 'user-1',
    now,
    signIns: [],
    endEvents: [],
    activity: [],
    liveSessions: [],
    ...input,
  });

describe('buildUserSessions', () => {
  it('should end a Session at its sign-out, with the recorded reason', () => {
    const [session] = build({
      signIns: [signIn('s1', '2026-11-22T08:00:00Z')],
      endEvents: [end({ entityId: 's1', reason: 'Signed out by the user' })],
    });

    expect(session).toMatchObject({
      status: 'signed-out',
      endedAt: at('2026-11-22T10:00:00Z'),
      endReason: 'Signed out by the user',
    });
  });

  it('should name the admin who ended a Session for someone else', () => {
    const [session] = build({
      signIns: [signIn('s1', '2026-11-22T08:00:00Z')],
      endEvents: [
        end({
          action: 'user.sessions-revoke',
          sessionIds: ['s1'],
          actorName: 'Rana Adnan',
          actorUserId: 'admin-1',
        }),
      ],
    });

    expect(session).toMatchObject({ status: 'revoked', endReason: 'Ended by Rana Adnan' });
  });

  it('should ignore an end event from before the sign-in', () => {
    const [session] = build({
      signIns: [signIn('s1', '2026-11-22T11:00:00Z')],
      endEvents: [end({ entityId: 's1', occurredOn: at('2026-11-22T10:00:00Z') })],
      liveSessions: [
        {
          id: 's1',
          createdAt: at('2026-11-22T11:00:00Z'),
          expiresAt: at('2026-11-23T11:00:00Z'),
          ipAddress: null,
          userAgent: null,
        },
      ],
    });

    expect(session.status).toBe('active');
  });

  it('should report a Session that is neither live nor ended as expired', () => {
    const [session] = build({ signIns: [signIn('s1', '2026-11-20T08:00:00Z')] });

    expect(session).toMatchObject({ status: 'expired', endedAt: null });
  });

  it('should carry the actions taken in each Session', () => {
    const [session] = build({
      signIns: [signIn('s1', '2026-11-22T08:00:00Z')],
      activity: [{ sessionId: 's1', actionCount: 7, lastActivityAt: at('2026-11-22T09:30:00Z') }],
    });

    expect(session).toMatchObject({
      actionCount: 7,
      lastActivityAt: at('2026-11-22T09:30:00Z'),
    });
  });

  it('should include live Sessions with no recorded sign-in, newest first', () => {
    const sessions = build({
      signIns: [signIn('s1', '2026-11-21T08:00:00Z')],
      liveSessions: [
        {
          id: 'old',
          createdAt: at('2026-11-22T07:00:00Z'),
          expiresAt: at('2026-11-23T07:00:00Z'),
          ipAddress: '::1',
          userAgent: 'Safari',
        },
        {
          id: 'gone',
          createdAt: at('2026-11-10T07:00:00Z'),
          expiresAt: at('2026-11-11T07:00:00Z'),
          ipAddress: null,
          userAgent: null,
        },
      ],
    });

    expect(sessions.map(({ sessionId }) => sessionId)).toEqual(['old', 's1']);
    expect(sessions[0]).toMatchObject({ status: 'active', signInRecorded: false });
  });
});
