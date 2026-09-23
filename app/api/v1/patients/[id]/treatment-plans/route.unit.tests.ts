import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPatientTreatmentPlansQuery } from '@/app/api/lib/modules/patient-treatment-plan/queries/get-patient-treatment-plans-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock(
  '@/app/api/lib/modules/patient-treatment-plan/queries/get-patient-treatment-plans-query',
  () => ({ getPatientTreatmentPlansQuery: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const getPlans = vi.mocked(getPatientTreatmentPlansQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'user-1' } },
};

const plan = {
  id: 1,
  tenantId: 'tenant-1',
  patientId: 12,
  treatmentId: 10,
  treatmentName: 'Abhyanga',
  treatmentCode: 'ABH',
  treatmentSourceIdentity: null,
  sessionStructure: 'REPEATABLE' as const,
  totalSessions: 2,
  statusOverride: null,
  legacySourceIdentity: null,
  legacySourceSystem: null,
  legacySourceKey: null,
  legacySourceContentHash: null,
  sourceImportBatchId: null,
  legacyVisitId: null,
  legacyVisitNumber: null,
  importBatchId: null,
  createdOn: new Date('2026-09-16T00:00:00Z'),
  modifiedOn: new Date('2026-09-16T00:00:00Z'),
  status: 'PENDING' as const,
  completedSessions: 0,
  sessions: [],
};

function request(search = '?status=current') {
  return new NextRequest(`http://localhost/api/v1/patients/12/treatment-plans${search}`);
}

function context(id = '12') {
  return {
    params: Promise.resolve({ id }),
  } as RouteContext<'/api/v1/patients/[id]/treatment-plans'>;
}

describe('Patient Treatment Plans route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    getPlans.mockResolvedValue({ success: true, data: [plan] });
  });

  it('should return unauthorized without checking permission or querying Plans', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(getPlans).not.toHaveBeenCalled();
  });

  it('should return forbidden when no active Tenant is selected', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json(
        { message: 'No active tenant selected.' },
        { status: StatusCodes.FORBIDDEN }
      )
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).not.toHaveBeenCalled();
    expect(getPlans).not.toHaveBeenCalled();
  });

  it('should return forbidden without querying Plans when read permission is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['patient-treatment-plan:read']);
    expect(getPlans).not.toHaveBeenCalled();
  });

  it('should return the current Patient Treatment Plans', async () => {
    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toMatchObject({
      data: [{ id: 1, treatmentName: 'Abhyanga', status: 'PENDING' }],
    });
  });

  it('should pass the asynchronous Patient id, active Tenant, and current status to the query', async () => {
    await GET(request(), context('42'));

    expect(getPlans).toHaveBeenCalledWith('42', 'tenant-1', 'current');
  });

  it('should map an invalid status to bad request', async () => {
    getPlans.mockResolvedValue({
      success: false,
      errors: ['Patient Treatment Plan status must be current'],
    });

    const response = await GET(request('?status=historical'), context());

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['Patient Treatment Plan status must be current'],
    });
    expect(getPlans).toHaveBeenCalledWith('12', 'tenant-1', 'historical');
  });

  it('should map a missing Tenant-scoped Patient to not found', async () => {
    getPlans.mockResolvedValue({
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient not found'],
    });

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    await expect(response.json()).resolves.toEqual({
      message: 'Patient not found',
      errors: ['Patient not found'],
    });
  });
});
