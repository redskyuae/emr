import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  analyticsActorFromSession: vi.fn(() => ({ userId: 'user_1', tenantId: 'tenant_1' })),
  recordServerEventAfterLookup: vi.fn(),
}));

vi.mock('@/app/api/lib/modules/role-permission/queries/get-role-permissions-query', () => ({
  getRolePermissionsQuery: vi.fn(),
}));

vi.mock('@/app/api/lib/modules/user-role/queries/get-user-roles-query', () => ({
  getUserRolesQuery: vi.fn(),
}));

import { recordServerEventAfterLookup } from '@/app/api/lib/analytics/server-analytics';
import { getRolePermissionsQuery } from '@/app/api/lib/modules/role-permission/queries/get-role-permissions-query';
import { getUserRolesQuery } from '@/app/api/lib/modules/user-role/queries/get-user-roles-query';
import type { TenantSession } from '@/app/api/lib/utils/auth-helpers';

import { recordRolePermissionRemoved, recordStaffRoleRemoved } from './access-assignment-event';

const tenantSession = { tenantId: 'tenant_1' } as TenantSession;
const request = new Request('http://localhost/api/v1/roles/3/permissions/9');

function lastLookup() {
  const [[actor, event, lookup]] = vi.mocked(recordServerEventAfterLookup).mock.calls;
  return { actor, event, lookup };
}

describe('access assignment events', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should count the Permission Assignments left on the Role after the response', async () => {
    vi.mocked(getRolePermissionsQuery).mockResolvedValue({
      success: true,
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
    } as never);

    recordRolePermissionRemoved(tenantSession, request, 3);
    const { actor, event, lookup } = lastLookup();

    expect(getRolePermissionsQuery).not.toHaveBeenCalled();
    expect(actor).toEqual({ userId: 'user_1', tenantId: 'tenant_1' });
    expect(event).toBe('role_permissions_changed');
    await expect(lookup()).resolves.toEqual({ permission_count: 3 });
    expect(getRolePermissionsQuery).toHaveBeenCalledWith(3, 'tenant_1');
  });

  it('should count the Role Assignments left on the Staff member after the response', async () => {
    vi.mocked(getUserRolesQuery).mockResolvedValue({
      success: true,
      data: [{ id: 1 }],
      total: 1,
    } as never);

    recordStaffRoleRemoved(tenantSession, request, 'staff_user_2');
    const { event, lookup } = lastLookup();

    expect(event).toBe('staff_roles_changed');
    await expect(lookup()).resolves.toEqual({ role_count: 1 });
    expect(getUserRolesQuery).toHaveBeenCalledWith('staff_user_2', 'tenant_1');
  });

  it('should record nothing when the remaining count cannot be read', async () => {
    vi.mocked(getUserRolesQuery).mockResolvedValue({
      success: false,
      errors: ['Staff not found'],
    } as never);

    recordStaffRoleRemoved(tenantSession, request, 'staff_user_2');

    await expect(lastLookup().lookup()).resolves.toBeNull();
  });
});
