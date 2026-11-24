import { StatusCodes } from 'http-status-codes';
import { after, NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { signinCommand } from '@/app/api/lib/modules/auth/commands/signin-command';
import { getSignInAuditActorQuery } from '@/app/api/lib/modules/auth/queries/get-sign-in-audit-actor-query';
import { hasReachedFailedSignInAuditCapQuery } from '@/app/api/lib/modules/audit-log/queries/has-reached-failed-sign-in-audit-cap-query';
import { POST } from './route';

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: vi.fn(),
}));

vi.mock('@/app/api/lib/analytics/access-tenant-event', () => ({ identifyTenantGroup: vi.fn() }));
vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  recordServerEvent: vi.fn(),
  analyticsSessionIdFromRequest: vi.fn(() => null),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEventFor: vi.fn() }));
vi.mock('@/app/api/lib/modules/auth/commands/signin-command', () => ({ signinCommand: vi.fn() }));
vi.mock('@/app/api/lib/modules/auth/queries/get-sign-in-audit-actor-query', () => ({
  getSignInAuditActorQuery: vi.fn(),
}));
vi.mock(
  '@/app/api/lib/modules/audit-log/queries/has-reached-failed-sign-in-audit-cap-query',
  () => ({
    hasReachedFailedSignInAuditCapQuery: vi.fn(),
  })
);

const signin = vi.mocked(signinCommand);
const recordAudit = vi.mocked(recordAuditEventFor);
const findActor = vi.mocked(getSignInAuditActorQuery);
const atCap = vi.mocked(hasReachedFailedSignInAuditCapQuery);
const scheduleAfter = vi.mocked(after);

const rejectedPassword = {
  success: false as const,
  errors: ['Invalid email or password'],
  status: StatusCodes.UNAUTHORIZED,
};

/** Runs the work the route scheduled with `after`, as Next does once the response is sent. */
async function runScheduledWork() {
  for (const [task] of scheduleAfter.mock.calls) {
    await (task as () => Promise<void>)();
  }
}

const sara = { id: 'user-1', name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' };

function signInRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/signin', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('Sign-in route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findActor.mockResolvedValue({ user: sara, tenantIds: ['tenant-1', 'tenant-2'] });
    atCap.mockResolvedValue({ success: true, data: false });
  });

  it('should record the sign-in with the new Session id', async () => {
    signin.mockResolvedValue({
      success: true,
      data: {
        tenant: { id: 'tenant-1' } as never,
        setCookies: [],
        userId: 'user-1',
        userName: 'Dr. Sara Ali',
        userEmail: 'sara.ali@hospital.example',
        sessionId: 'session-9',
        rememberMe: true,
      },
    });

    const response = await POST(signInRequest({ email: sara.email, password: 'x' }));

    expect(response.status).toBe(StatusCodes.OK);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', userId: 'user-1', sessionId: 'session-9' }),
      expect.any(NextRequest),
      'auth.sign-in',
      expect.objectContaining({ entityId: 'session-9', metadata: { rememberMe: true } })
    );
  });

  it('should answer a rejected password before any failed attempt is looked up or recorded', async () => {
    signin.mockResolvedValue(rejectedPassword);

    const response = await POST(signInRequest({ email: sara.email, password: 'wrong' }));

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(scheduleAfter).toHaveBeenCalledTimes(1);
    expect(findActor).not.toHaveBeenCalled();
    expect(atCap).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should record a rejected password as a failed attempt in each of the user’s Tenants', async () => {
    signin.mockResolvedValue(rejectedPassword);

    const response = await POST(signInRequest({ email: sara.email, password: 'wrong' }));
    await runScheduledWork();

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(findActor).toHaveBeenCalledWith(sara.email);
    expect(atCap).toHaveBeenCalledWith('tenant-1', 'user-1');
    expect(atCap).toHaveBeenCalledWith('tenant-2', 'user-1');
    expect(recordAudit).toHaveBeenCalledTimes(2);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-2', userId: 'user-1' }),
      expect.any(NextRequest),
      'auth.sign-in-failed',
      { reason: 'Invalid email or password', outcome: 'failed', entityLabel: sara.email }
    );
  });

  it('should skip recording in a Tenant where the user is at the failed sign-in cap', async () => {
    signin.mockResolvedValue(rejectedPassword);
    atCap.mockImplementation(async (tenantId) => ({
      success: true,
      data: tenantId === 'tenant-1',
    }));

    await POST(signInRequest({ email: sara.email, password: 'wrong' }));
    await runScheduledWork();

    expect(recordAudit).toHaveBeenCalledTimes(1);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-2' }),
      expect.any(NextRequest),
      'auth.sign-in-failed',
      expect.anything()
    );
  });

  it('should record a blocked account as a failed attempt after the 403', async () => {
    signin.mockResolvedValue({
      success: false,
      errors: ['Your account is banned'],
      status: StatusCodes.FORBIDDEN,
    });

    const response = await POST(signInRequest({ email: sara.email, password: 'right' }));
    await runScheduledWork();

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(NextRequest),
      'auth.sign-in-failed',
      expect.objectContaining({ reason: 'Your account is banned', outcome: 'failed' })
    );
  });

  it('should swallow a failure to record a failed attempt', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    signin.mockResolvedValue(rejectedPassword);
    findActor.mockRejectedValue(new Error('database down'));

    const response = await POST(signInRequest({ email: sara.email, password: 'wrong' }));

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    await expect(runScheduledWork()).resolves.toBeUndefined();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should never record the attempted password', async () => {
    signin.mockResolvedValue(rejectedPassword);

    await POST(signInRequest({ email: sara.email, password: 'secret-attempt' }));
    await runScheduledWork();

    expect(JSON.stringify(recordAudit.mock.calls)).not.toContain('secret-attempt');
  });

  it('should not record a request that failed validation', async () => {
    signin.mockResolvedValue({
      success: false,
      errors: ['Email is required'],
      status: StatusCodes.BAD_REQUEST,
    });

    await POST(signInRequest({}));

    expect(scheduleAfter).not.toHaveBeenCalled();
    expect(findActor).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
