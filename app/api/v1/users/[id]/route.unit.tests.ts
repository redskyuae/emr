import { StatusCodes } from 'http-status-codes';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { updateStaffCommand } from '@/app/api/lib/modules/staff/commands/update-staff-command';
import { getStaffByIdQuery } from '@/app/api/lib/modules/staff/queries/get-staff-by-id-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { PUT } from './route';

vi.mock('@/app/api/lib/analytics/server-analytics', () => ({
  recordServerEvent: vi.fn(),
  analyticsActorFromSession: vi.fn(),
}));
vi.mock('@/app/api/lib/audit/audit-recorder', () => ({ recordAuditEvent: vi.fn() }));
vi.mock('@/app/api/lib/modules/staff/commands/update-staff-command', () => ({
  updateStaffCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/staff/queries/get-staff-by-id-query', () => ({
  getStaffByIdQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantAdminSession: vi.fn() }));

const requireAdmin = vi.mocked(requireTenantAdminSession);
const getStaff = vi.mocked(getStaffByIdQuery);
const updateStaff = vi.mocked(updateStaffCommand);
const recordAudit = vi.mocked(recordAuditEvent);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'admin-1' } } };
const context = { params: Promise.resolve({ id: 'user-7' }) };
const staff = {
  id: 'user-7',
  name: 'Omar Haddad',
  email: 'omar.haddad@hospital.example',
  phone: '+971501234567',
};

function request() {
  return new NextRequest('http://localhost/api/v1/users/user-7', {
    method: 'PUT',
    body: JSON.stringify({ phone: '+971509876543' }),
  });
}

describe('Update Staff route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue(tenantSession as never);
    getStaff.mockResolvedValue({ success: true, data: staff } as never);
    updateStaff.mockResolvedValue({
      success: true,
      data: { ...staff, phone: '+971509876543' },
    } as never);
  });

  it('should read the Staff before updating and record the changed fields', async () => {
    const response = await PUT(request(), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(getStaff.mock.invocationCallOrder[0]).toBeLessThan(
      updateStaff.mock.invocationCallOrder[0]
    );
    expect(recordAudit).toHaveBeenCalledWith(tenantSession, expect.anything(), 'user.update', {
      entityId: 'user-7',
      entityLabel: 'omar.haddad@hospital.example',
      changes: [{ field: 'phone', label: 'Phone', from: '+971501234567', to: '+971509876543' }],
    });
  });

  it('should record no changes when the Staff could not be read first', async () => {
    getStaff.mockResolvedValue({ success: false, errors: ['Staff not found'] } as never);

    await PUT(request(), context);

    expect(recordAudit).toHaveBeenCalledWith(
      tenantSession,
      expect.anything(),
      'user.update',
      expect.objectContaining({ changes: null })
    );
  });
});
