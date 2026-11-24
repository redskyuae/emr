import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { updateRoleCommand } from '@/app/api/lib/modules/role/commands/update-role-command';
import { getRoleByIdQuery } from '@/app/api/lib/modules/role/queries/get-role-by-id-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  recordServerEvent: vi.fn(),
  analyticsActorFromSession: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/role/commands/delete-role-command', () => ({
  deleteRoleCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/role/commands/update-role-command', () => ({
  updateRoleCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/role/queries/get-role-by-id-query', () => ({
  getRoleByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantAdminSession: vi.fn() }));

const requireAdmin = vi.mocked(requireTenantAdminSession);
const getRole = vi.mocked(getRoleByIdQuery);
const updateRole = vi.mocked(updateRoleCommand);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'admin-1' } } };
const context = { params: Promise.resolve({ id: '4' }) };
const role = { id: 4, name: 'Nurse', code: 'NURSE', description: null, isSystem: false };

function request() {
  return new NextRequest('http://localhost/api/v1/roles/4', {
    method: 'PUT',
    body: JSON.stringify({ name: 'Staff Nurse' }),
  });
}

describe('Update Role route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue(tenantSession as never);
    getRole.mockResolvedValue({ success: true, data: role } as never);
    updateRole.mockResolvedValue({
      success: true,
      data: { ...role, name: 'Staff Nurse', description: 'Ward nursing staff' },
    } as never);
  });

  it('should read the Role before updating and record the changed fields', async () => {
    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(getRole.mock.invocationCallOrder[0]).toBeLessThan(
      updateRole.mock.invocationCallOrder[0]
    );
    expect(recordAudit).toHaveBeenCalledWith(tenantSession, expect.anything(), 'role.update', {
      entityId: 4,
      entityLabel: 'Staff Nurse',
      changes: [
        { field: 'name', label: 'Name', from: 'Nurse', to: 'Staff Nurse' },
        { field: 'description', label: 'Description', from: null, to: 'Ward nursing staff' },
      ],
    });
  });

  it('should record no changes when the Role could not be read first', async () => {
    getRole.mockResolvedValue({ success: false, errors: ['Role not found'] } as never);

    await PUT(request(), context);

    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'role.update',
      expect.objectContaining({ changes: null })
    );
  });
});
