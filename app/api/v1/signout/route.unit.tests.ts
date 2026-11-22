import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { signoutCommand } from '@/app/api/lib/modules/auth/commands/signout-command';
import { getSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEventFor: vi.fn() }));
vi.mock('@/app/api/lib/modules/auth/commands/signout-command', () => ({ signoutCommand: vi.fn() }));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ getSession: vi.fn() }));

const signout = vi.mocked(signoutCommand);
const recordAudit = vi.mocked(recordAuditEventFor);
const currentSession = vi.mocked(getSession);

const session = {
  user: { id: 'user-1', name: 'Dr. Sara Ali', email: 'sara.ali@hospital.example' },
  session: { id: 'session-9', activeOrganizationId: 'tenant-1', impersonatedBy: null },
};

const signOutRequest = (query = '') =>
  new NextRequest(`http://localhost/api/v1/signout${query}`, { method: 'POST' });

describe('Sign-out route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSession.mockResolvedValue(session as never);
    signout.mockResolvedValue({ success: true, data: { setCookies: [] } });
  });

  it('should record the sign-out of the ending Session with why it ended', async () => {
    const response = await POST(signOutRequest('?trigger=stale_tab'));

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', sessionId: 'session-9' }),
      expect.any(NextRequest),
      'auth.sign-out',
      expect.objectContaining({
        entityId: 'session-9',
        reason: 'Ended because the browser tab was closed or reopened',
        metadata: { trigger: 'stale_tab' },
      })
    );
  });

  it('should record no reason for an unknown trigger', async () => {
    await POST(signOutRequest('?trigger=<script>'));

    expect(recordAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'auth.sign-out',
      expect.objectContaining({ reason: null, metadata: null })
    );
  });

  it('should record nothing when there was no Session or the sign-out failed', async () => {
    currentSession.mockResolvedValue(null);
    await POST(signOutRequest());

    currentSession.mockResolvedValue(session as never);
    signout.mockResolvedValue({ success: false, errors: ['Sign out failed.'], status: 500 });
    await POST(signOutRequest());

    expect(recordAudit).not.toHaveBeenCalled();
  });
});
