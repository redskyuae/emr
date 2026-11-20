import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getConsolidatedPatientReportQuery } from '@/app/api/lib/modules/consolidated-patient-report/queries/get-consolidated-patient-report-query';
import type { ConsolidatedPatientReport } from '@/app/api/lib/modules/consolidated-patient-report/schemas/consolidated-patient-report-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock(
  '@/app/api/lib/modules/consolidated-patient-report/queries/get-consolidated-patient-report-query',
  () => ({ getConsolidatedPatientReportQuery: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const getReport = vi.mocked(getConsolidatedPatientReportQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'user-1', name: 'Dr. Lakshmi Menon' } },
};
const report = { patient: { id: 7, mrn: 'MRN-1284' } } as ConsolidatedPatientReport;

function request(query = '?fromDate=01-11-2026&toDate=20-11-2026') {
  return new NextRequest(`http://localhost/api/v1/patients/7/consolidated-report${query}`);
}

function context(id = '7') {
  return { params: Promise.resolve({ id }) };
}

describe('Consolidated Patient Report route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    getReport.mockResolvedValue({ success: true, data: report });
  });

  it('should return unauthorized without reading the report', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(getReport).not.toHaveBeenCalled();
  });

  it('should return forbidden without reading the report when visit:read is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit:read']);
    expect(getReport).not.toHaveBeenCalled();
  });

  it('should pass the Patient, period and generating user to the query', async () => {
    const response = await GET(request(), context('7'));

    expect(response.status).toBe(StatusCodes.OK);
    expect(getReport).toHaveBeenCalledWith(
      '7',
      'tenant-1',
      { fromDate: '01-11-2026', toDate: '20-11-2026' },
      { generatedBy: 'Dr. Lakshmi Menon' }
    );
    await expect(response.json()).resolves.toEqual({ data: report });
  });

  it('should pass missing dates as undefined so validation reports them', async () => {
    await GET(request(''), context());

    expect(getReport).toHaveBeenCalledWith(
      '7',
      'tenant-1',
      { fromDate: undefined, toDate: undefined },
      expect.anything()
    );
  });

  it('should map validation failures to 400', async () => {
    getReport.mockResolvedValue({ success: false, errors: ['From date is required'] });

    const response = await GET(request(''), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['From date is required'],
    });
  });

  it('should map a missing Patient to 404', async () => {
    getReport.mockResolvedValue({
      success: false,
      errors: ['Patient not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await GET(request(), context('99'));

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    await expect(response.json()).resolves.toEqual({
      message: 'Patient not found',
      errors: ['Patient not found'],
    });
  });

  it('should return 500 when the query throws', async () => {
    getReport.mockRejectedValue(new Error('boom'));

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
