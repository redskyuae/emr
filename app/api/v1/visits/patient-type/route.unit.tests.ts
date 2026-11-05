import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getVisitPatientTypeQuery } from '@/app/api/lib/modules/visit/queries/get-visit-patient-type-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/modules/visit/queries/get-visit-patient-type-query', () => ({
  getVisitPatientTypeQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const query = vi.mocked(getVisitPatientTypeQuery);
const session = vi.mocked(requireTenantSession);
const permissions = vi.mocked(requireTenantPermissions);

const request = () => new NextRequest('http://localhost/api/v1/visits/patient-type?patientId=7');

describe('GET Visit Patient type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.mockResolvedValue({ tenantId: 'tenant-a' } as never);
    permissions.mockResolvedValue(null);
    query.mockResolvedValue({ success: true, data: { patientType: 'NEW' } as never });
  });

  it('should return 401 without a Session', async () => {
    session.mockResolvedValue(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

    expect((await GET(request())).status).toBe(401);
    expect(permissions).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it('should return 403 without Visit read permission', async () => {
    permissions.mockResolvedValue(NextResponse.json({ message: 'Forbidden' }, { status: 403 }));

    expect((await GET(request())).status).toBe(403);
    expect(permissions).toHaveBeenCalledWith(expect.anything(), ['visit:read']);
    expect(query).not.toHaveBeenCalled();
  });

  it('should return the assessment for the session Tenant', async () => {
    const response = await GET(request());

    expect(query).toHaveBeenCalledWith('7', 'tenant-a');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { patientType: 'NEW' } });
  });

  it('should map query failures to their status', async () => {
    query.mockResolvedValue({ success: false, errors: ['Patient not found.'], status: 404 });

    const response = await GET(request());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: 'Patient not found.',
      errors: ['Patient not found.'],
    });
  });
});
