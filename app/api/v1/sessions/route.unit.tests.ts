import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { revokeAllSessionsCommand } from '@/app/api/lib/modules/session/commands/revoke-all-sessions-command';
import { getSessionsQuery } from '@/app/api/lib/modules/session/queries/get-sessions-query';
import type { SessionListItem } from '@/app/api/lib/modules/session/schemas/session-schema';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import { DELETE } from './route';

vi.mock('@/app/api/lib/analytics/access-session-event', () => ({
  recordOwnSessionsRevoked: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEventFor: vi.fn() }));
vi.mock('@/app/api/lib/modules/session/commands/revoke-all-sessions-command', () => ({
  revokeAllSessionsCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/session/queries/get-sessions-query', () => ({
  getSessionsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireAuth: vi.fn() }));

const auth = vi.mocked(requireAuth);
const getSessions = vi.mocked(getSessionsQuery);
const revokeAll = vi.mocked(revokeAllSessionsCommand);
const recordAudit = vi.mocked(recordAuditEventFor);

const sara = { id: 'user-1', name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' };

function signedIn(activeOrganizationId: string | null = 'tenant-1') {
  return {
    user: sara,
    session: { id: 'session-current', activeOrganizationId, impersonatedBy: null },
  };
}

function sessionItem(id: string, isCurrent = false) {
  return { id, isCurrent } as SessionListItem;
}

function request() {
  return new Request('http://localhost/api/v1/sessions', { method: 'DELETE' });
}

describe('Revoke own Sessions route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue(signedIn() as never);
    revokeAll.mockResolvedValue({ success: true, data: undefined } as never);
    getSessions.mockResolvedValue({
      success: true,
      data: [
        sessionItem('session-current', true),
        sessionItem('session-2'),
        sessionItem('session-3'),
      ],
      total: 3,
    });
  });

  it('should record the other Sessions it ended, without the current one', async () => {
    const response = await DELETE(request());

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(getSessions).toHaveBeenCalledWith('user-1', 'session-current');
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        sessionId: 'session-current',
      }),
      expect.any(Request),
      'auth.session-revoke',
      {
        entityLabel: sara.email,
        metadata: { sessionIds: ['session-2', 'session-3'], scope: 'all' },
      }
    );
  });

  it('should record an empty list when the Sessions could not be read first', async () => {
    getSessions.mockResolvedValue({ success: false, errors: ['User id is Invalid.'] });

    await DELETE(request());

    expect(recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Request),
      'auth.session-revoke',
      expect.objectContaining({ metadata: { sessionIds: [], scope: 'all' } })
    );
  });

  it('should not record anything for a Session with no active Tenant', async () => {
    auth.mockResolvedValue(signedIn(null) as never);

    const response = await DELETE(request());

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should not record a revoke that failed', async () => {
    revokeAll.mockResolvedValue({ success: false, errors: ['Validation failed'] } as never);

    const response = await DELETE(request());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
