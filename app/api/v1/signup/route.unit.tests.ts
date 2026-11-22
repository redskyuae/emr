import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { provisionTenantCommand } from '@/app/api/lib/modules/tenant-provisioning/commands/provision-tenant-command';
import { POST } from './route';

vi.mock('@/app/api/lib/analytics/access-tenant-event', () => ({ identifyTenantGroup: vi.fn() }));
vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  recordServerEvent: vi.fn(),
  analyticsSessionIdFromRequest: vi.fn(() => null),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEventFor: vi.fn() }));
vi.mock('@/app/api/lib/modules/tenant-provisioning/commands/provision-tenant-command', () => ({
  provisionTenantCommand: vi.fn(),
}));

const provision = vi.mocked(provisionTenantCommand);
const recordAudit = vi.mocked(recordAuditEventFor);

const signupBody = {
  password: 'Str0ngPass!',
  ownerName: 'Dr. Priya Raghavan',
  tenantName: 'Apollo Hospitals',
  ownerEmail: 'priya@apollo.example',
};

function signupRequest(body: string) {
  return new NextRequest('http://localhost/api/v1/signup', { method: 'POST', body });
}

describe('Signup route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should record the new Tenant Owner’s first sign-in with its Session id', async () => {
    provision.mockResolvedValue({
      success: true,
      data: {
        tenant: { id: 'tenant-1' } as never,
        setCookies: ['session=abc'],
        userId: 'user-1',
        userName: 'Dr. Priya Raghavan',
        userEmail: 'priya@apollo.example',
        sessionId: 'session-9',
      },
    });

    const response = await POST(signupRequest(JSON.stringify(signupBody)));

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.headers.get('set-cookie')).toContain('session=abc');
    expect(recordAudit).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Dr. Priya Raghavan',
        email: 'priya@apollo.example',
        sessionId: 'session-9',
      },
      expect.any(NextRequest),
      'auth.sign-in',
      {
        entityId: 'session-9',
        entityLabel: 'priya@apollo.example',
        metadata: { rememberMe: true, signup: true },
      }
    );
  });

  it('should never record the signup password', async () => {
    provision.mockResolvedValue({
      success: true,
      data: {
        tenant: { id: 'tenant-1' } as never,
        setCookies: [],
        userId: 'user-1',
        userName: 'Dr. Priya Raghavan',
        userEmail: 'priya@apollo.example',
        sessionId: null,
      },
    });

    await POST(signupRequest(JSON.stringify(signupBody)));

    expect(JSON.stringify(recordAudit.mock.calls)).not.toContain(signupBody.password);
  });

  it('should not record a sign-in when provisioning fails', async () => {
    provision.mockResolvedValue({
      success: false,
      errors: ['A user with this email already exists.'],
      status: StatusCodes.CONFLICT,
    });

    const response = await POST(signupRequest(JSON.stringify(signupBody)));

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('should reject a body that is not valid JSON without provisioning', async () => {
    const response = await POST(signupRequest('{not json'));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(provision).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
