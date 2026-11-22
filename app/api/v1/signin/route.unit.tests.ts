import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { signinCommand } from '@/app/api/lib/modules/auth/commands/signin-command';
import { getSignInAuditActorQuery } from '@/app/api/lib/modules/auth/queries/get-sign-in-audit-actor-query';
import { POST } from './route';

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

const signin = vi.mocked(signinCommand);
const recordAudit = vi.mocked(recordAuditEventFor);
const findActor = vi.mocked(getSignInAuditActorQuery);

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

  it('should record a rejected password as a failed attempt in each of the user’s Tenants', async () => {
    signin.mockResolvedValue({
      success: false,
      errors: ['Invalid email or password'],
      status: StatusCodes.UNAUTHORIZED,
    });

    const response = await POST(signInRequest({ email: sara.email, password: 'wrong' }));

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(findActor).toHaveBeenCalledWith(sara.email);
    expect(recordAudit).toHaveBeenCalledTimes(2);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-2', userId: 'user-1' }),
      expect.any(NextRequest),
      'auth.sign-in-failed',
      { reason: 'Invalid email or password', outcome: 'failed', entityLabel: sara.email }
    );
  });

  it('should never record the attempted password', async () => {
    signin.mockResolvedValue({
      success: false,
      errors: ['Invalid email or password'],
      status: StatusCodes.UNAUTHORIZED,
    });

    await POST(signInRequest({ email: sara.email, password: 'secret-attempt' }));

    expect(JSON.stringify(recordAudit.mock.calls)).not.toContain('secret-attempt');
  });

  it('should not record a request that failed validation', async () => {
    signin.mockResolvedValue({
      success: false,
      errors: ['Email is required'],
      status: StatusCodes.BAD_REQUEST,
    });

    await POST(signInRequest({}));

    expect(findActor).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
