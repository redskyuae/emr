import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { identifyTenantGroup } from '@/app/api/lib/analytics/access-tenant-event';
import { recordServerEvent } from '@/app/api/lib/analytics/server-analytics';
import { onboardTenantCommand } from '@/app/api/lib/modules/tenant-provisioning/commands/onboard-tenant-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/modules/tenant-provisioning/commands/onboard-tenant-command', () => ({
  onboardTenantCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));
vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user-1', tenantId: 'tenant-1' })),
  recordServerEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/analytics/access-tenant-event', () => ({
  identifyTenantGroup: vi.fn(),
  minutesSinceSignup: vi.fn(() => 12),
}));

const onboard = vi.mocked(onboardTenantCommand);
const requireSession = vi.mocked(requireTenantSession);

const tenant = {
  id: 'tenant-1',
  name: 'Apollo Hospitals',
  slug: 'apollo',
  createdAt: new Date('2026-11-21T10:00:00.000Z'),
  isActive: true,
  logo: null,
  timeZone: 'Asia/Dubai',
  isOnboarded: true,
};

function postRequest() {
  return new Request('http://localhost/api/v1/onboarding', { method: 'POST' });
}

describe('Tenant Onboarding route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({
      tenantId: 'tenant-1',
      session: { user: { id: 'user-1' }, session: {} },
    } as never);
  });

  it('should record tenant_onboarded once when onboarding completes', async () => {
    onboard.mockResolvedValue({ success: true, data: { tenant, isNewlyOnboarded: true } });

    const response = await POST(postRequest());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({
      data: { tenant: { ...tenant, createdAt: '2026-11-21T10:00:00.000Z' } },
    });
    expect(recordServerEvent).toHaveBeenCalledTimes(1);
    expect(recordServerEvent).toHaveBeenCalledWith(
      { userId: 'user-1', tenantId: 'tenant-1' },
      'tenant_onboarded',
      { minutes_since_signup: 12 }
    );
    expect(identifyTenantGroup).toHaveBeenCalledWith(tenant);
  });

  it('should record nothing when the Tenant was already onboarded', async () => {
    onboard.mockResolvedValue({ success: true, data: { tenant, isNewlyOnboarded: false } });

    const response = await POST(postRequest());

    expect(response.status).toBe(StatusCodes.OK);
    expect(recordServerEvent).not.toHaveBeenCalled();
    expect(identifyTenantGroup).not.toHaveBeenCalled();
  });

  it('should record nothing when onboarding fails', async () => {
    onboard.mockResolvedValue({
      success: false,
      errors: ['Tenant onboarding failed.'],
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });

    const response = await POST(postRequest());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(recordServerEvent).not.toHaveBeenCalled();
  });
});
