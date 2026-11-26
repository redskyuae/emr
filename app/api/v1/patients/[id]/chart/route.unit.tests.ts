import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPatientChartQuery } from '@/app/api/lib/modules/patient-chart/queries/get-patient-chart-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/modules/patient-chart/queries/get-patient-chart-query', () => ({
  getPatientChartQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const getChart = vi.mocked(getPatientChartQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = { tenantId: 'tenant-1', session: { user: { id: 'user-1' } } };
const chart = { patient: { id: 7, mrn: 'MRN-1284' } };

function request() {
  return new NextRequest('http://localhost/api/v1/patients/7/chart');
}

function context(id = '7') {
  return { params: Promise.resolve({ id }) };
}

describe('Patient Chart route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    getChart.mockResolvedValue({ success: true, data: chart } as never);
  });

  it('should return unauthorized without checking permission', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(getChart).not.toHaveBeenCalled();
  });

  it('should return forbidden without reading the chart when patient-chart:read is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
    expect(getChart).not.toHaveBeenCalled();
  });

  it('should require patient-chart:read and return the Patient Chart', async () => {
    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({ data: chart });
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['patient-chart:read']);
    expect(getChart).toHaveBeenCalledWith('7', 'tenant-1');
  });
});
