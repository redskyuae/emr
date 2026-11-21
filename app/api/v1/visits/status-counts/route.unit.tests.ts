import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getVisitStatusCountsQuery } from '@/app/api/lib/modules/visit/queries/get-visit-status-counts-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/modules/visit/queries/get-visit-status-counts-query', () => ({
  getVisitStatusCountsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const query = vi.mocked(getVisitStatusCountsQuery);
const session = vi.mocked(requireTenantSession);
const permissions = vi.mocked(requireTenantPermissions);
const counts = { CHECKED_IN: 3, IN_CONSULTATION: 1, COMPLETED: 5, CANCELLED: 0 };

const request = (search = '?visitDate=16-07-2026&doctorId=4') =>
  new NextRequest(`http://localhost/api/v1/visits/status-counts${search}`);

describe('GET Visit status counts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue({ tenantId: 'tenant-a' } as never);
    permissions.mockResolvedValue(null);
    query.mockResolvedValue({ success: true, data: counts });
  });

  it('should return 401 without a Session', async () => {
    session.mockResolvedValue(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

    expect((await GET(request())).status).toBe(401);
    expect(query).not.toHaveBeenCalled();
  });

  it('should return 403 without Visit read permission', async () => {
    permissions.mockResolvedValue(NextResponse.json({ message: 'Forbidden' }, { status: 403 }));

    expect((await GET(request())).status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });

  it('should pass the session Tenant and trimmed query parameters to the query', async () => {
    const response = await GET(request('?visitDate=%2016-07-2026%20&doctorId=4'));

    expect(query).toHaveBeenCalledWith({
      tenantId: 'tenant-a',
      filters: { visitDate: '16-07-2026', doctorId: '4' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: counts });
  });

  it('should return 400 with the validation errors', async () => {
    query.mockResolvedValue({ success: false, errors: ['Visit date is required'] });

    const response = await GET(request(''));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'Validation failed',
      errors: ['Visit date is required'],
    });
  });

  it('should return 500 when the query throws', async () => {
    query.mockRejectedValue(new Error('db down'));

    expect((await GET(request())).status).toBe(500);
  });
});
