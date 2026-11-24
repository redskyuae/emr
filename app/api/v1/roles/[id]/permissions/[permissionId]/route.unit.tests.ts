import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getPermissionByIdQuery } from '@/app/api/lib/modules/permission/queries/get-permission-by-id-query';
import { getRoleByIdQuery } from '@/app/api/lib/modules/role/queries/get-role-by-id-query';
import { removePermissionCommand } from '@/app/api/lib/modules/role-permission/commands/remove-permission-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { DELETE } from './route';

vi.mock('@/app/api/lib/analytics/access-assignment-event', () => ({
  recordRolePermissionRemoved: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/permission/queries/get-permission-by-id-query', () => ({
  getPermissionByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/role/queries/get-role-by-id-query', () => ({
  getRoleByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/role-permission/commands/remove-permission-command', () => ({
  removePermissionCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantAdminSession: vi.fn() }));

const requireAdmin = vi.mocked(requireTenantAdminSession);
const removePermission = vi.mocked(removePermissionCommand);
const getRole = vi.mocked(getRoleByIdQuery);
const getPermission = vi.mocked(getPermissionByIdQuery);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'admin-1' } } };
const context = { params: Promise.resolve({ id: '4', permissionId: '17' }) };

function request() {
  return new NextRequest('http://localhost/api/v1/roles/4/permissions/17', { method: 'DELETE' });
}

/** The details the route handed the recorder, resolving a lazy lookup as the recorder does. */
async function recordedDetails() {
  const details = recordAudit.mock.calls[0]?.[3];

  return typeof details === 'function' ? await details() : details;
}

describe('Remove Role permission route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue(tenantSession as never);
    removePermission.mockResolvedValue({
      success: true,
      data: { roleId: 4, permissionId: 17 },
    } as never);
    getRole.mockResolvedValue({ success: true, data: { id: 4, name: 'Nurse' } } as never);
    getPermission.mockResolvedValue({
      success: true,
      data: { id: 17, name: 'patient:delete' },
    } as never);
  });

  it('should record the revoked permission by name, as the bulk routes do', async () => {
    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'role.permissions-change',
      expect.any(Function)
    );
    await expect(recordedDetails()).resolves.toEqual({
      entityId: 4,
      entityLabel: 'Nurse',
      metadata: { granted: [], revoked: ['patient:delete'] },
    });
    expect(getPermission).toHaveBeenCalledWith(17);
  });

  it('should answer without waiting on the lookups that only serve the Audit Event', async () => {
    getRole.mockRejectedValue(new Error('database down'));
    getPermission.mockRejectedValue(new Error('database down'));

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    expect(getRole).not.toHaveBeenCalled();
    expect(getPermission).not.toHaveBeenCalled();
  });

  it('should not record a removal that failed', async () => {
    removePermission.mockResolvedValue({
      success: false,
      errors: ['Permission Assignment not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await DELETE(request(), context);

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    expect(recordAudit).not.toHaveBeenCalled();
  });
});
