import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { revokeSessionCommand } from '@/app/api/lib/modules/session/commands/revoke-session-command';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import { DELETE } from './route';

vi.mock('@/app/api/lib/analytics/access-session-event', () => ({
  recordOwnSessionsRevoked: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEventFor: vi.fn() }));
vi.mock('@/app/api/lib/modules/session/commands/revoke-session-command', () => ({
  revokeSessionCommand: vi.fn(),
  CANNOT_REVOKE_CURRENT_SESSION_MESSAGE: 'You cannot revoke your current Session.',
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireAuth: vi.fn() }));

const auth = vi.mocked(requireAuth);
const revoke = vi.mocked(revokeSessionCommand);
const recordAudit = vi.mocked(recordAuditEventFor);

const sara = { id: 'user-1', name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' };
const context = { params: Promise.resolve({ sessionId: 'session-2' }) };

function signedIn(activeOrganizationId: string | null = 'tenant-1') {
  return {
    user: sara,
    session: { id: 'session-current', activeOrganizationId, impersonatedBy: 'support-9' },
  };
}

function request() {
  return new NextRequest('http://localhost/api/v1/sessions/session-2', { method: 'DELETE' });
}

describe('Revoke one own Session route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue(signedIn() as never);
    revoke.mockResolvedValue({ success: true, data: undefined } as never);
  });

  it('should record the ended Session from the current Session', async () => {
    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(revoke).toHaveBeenCalledWith('session-2', 'user-1', 'session-current');
    expect(recordAudit).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: sara.name,
        email: sara.email,
        sessionId: 'session-current',
        impersonatedBy: 'support-9',
      },
      expect.any(NextRequest),
      'auth.session-revoke',
      {
        entityId: 'session-2',
        entityLabel: sara.email,
        metadata: { sessionIds: ['session-2'] },
      }
    );
  });

  it('should not record anything for a Session with no active Tenant', async () => {
    auth.mockResolvedValue(signedIn(null) as never);

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should refuse to revoke the current Session without recording it', async () => {
    revoke.mockResolvedValue({
      success: false,
      errors: ['You cannot revoke your current Session.'],
      status: StatusCodes.UNPROCESSABLE_ENTITY,
    } as never);

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    await expect(response.json()).resolves.toEqual({
      message: 'You cannot revoke your current Session.',
    });
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
