import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { revokeUserSessionsCommand } from '@/app/api/lib/modules/session/commands/revoke-user-sessions-command';
import { getUserSessionsQuery } from '@/app/api/lib/modules/session/queries/get-user-sessions-query';
import type { SessionListItem } from '@/app/api/lib/modules/session/schemas/session-schema';
import { getStaffByIdQuery } from '@/app/api/lib/modules/staff/queries/get-staff-by-id-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { DELETE } from './route';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  recordServerEvent: vi.fn(),
  analyticsActorFromSession: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/session/commands/revoke-user-sessions-command', () => ({
  revokeUserSessionsCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/session/queries/get-user-sessions-query', () => ({
  getUserSessionsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/staff/queries/get-staff-by-id-query', () => ({
  getStaffByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantAdminSession: vi.fn() }));

const requireAdmin = vi.mocked(requireTenantAdminSession);
const getUserSessions = vi.mocked(getUserSessionsQuery);
const revokeUserSessions = vi.mocked(revokeUserSessionsCommand);
const getStaff = vi.mocked(getStaffByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'admin-1' }, session: { id: 'session-admin' } },
};
const context = { params: Promise.resolve({ id: 'user-7' }) };

function request() {
  return new NextRequest('http://localhost/api/v1/users/user-7/sessions', { method: 'DELETE' });
}

/** The details the route handed the recorder, resolving a lazy lookup as the recorder does. */
async function recordedDetails() {
  const details = recordAudit.mock.calls[0]?.[3];

  return typeof details === 'function' ? await details() : details;
}

describe('Revoke a user’s Sessions route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue(tenantSession as never);
    revokeUserSessions.mockResolvedValue({ success: true, data: undefined });
    getStaff.mockResolvedValue({
      success: true,
      data: { email: 'omar.haddad@hospital.example' },
    } as never);
    getUserSessions.mockResolvedValue({
      success: true,
      data: [{ id: 'session-a' }, { id: 'session-b' }] as SessionListItem[],
      total: 2,
    });
  });

  it('should record each Session the revoke ended, read before revoking', async () => {
    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(getUserSessions).toHaveBeenCalledWith('user-7', 'tenant-1', 'session-admin');
    expect(getUserSessions.mock.invocationCallOrder[0]).toBeLessThan(
      revokeUserSessions.mock.invocationCallOrder[0]
    );
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.any(NextRequest),
      'user.sessions-revoke',
      expect.any(Function)
    );
    await expect(recordedDetails()).resolves.toEqual({
      entityId: 'user-7',
      entityLabel: 'omar.haddad@hospital.example',
      metadata: { sessionIds: ['session-a', 'session-b'] },
    });
  });

  it('should answer without waiting on the Staff lookup that only labels the Audit Event', async () => {
    getStaff.mockRejectedValue(new Error('database down'));

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(getStaff).not.toHaveBeenCalled();
  });

  it('should record an empty list when the Sessions could not be read first', async () => {
    getUserSessions.mockResolvedValue({ success: false, errors: ['Staff not found'] });
    getStaff.mockResolvedValue({ success: false, errors: ['Staff not found'] });

    await DELETE(request(), context);

    await expect(recordedDetails()).resolves.toEqual({
      entityId: 'user-7',
      entityLabel: null,
      metadata: { sessionIds: [] },
    });
  });

  it('should not record a revoke that failed', async () => {
    revokeUserSessions.mockResolvedValue({
      success: false,
      errors: ['Staff not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
