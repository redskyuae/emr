import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getVisitSummaryQuery } from '@/app/api/lib/modules/visit/queries/get-visit-summary-query';
import type { VisitSummary } from '@/app/api/lib/modules/visit/schemas/visit-summary-schema';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/modules/visit/queries/get-visit-summary-query', () => ({
  getVisitSummaryQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const getSummary = vi.mocked(getVisitSummaryQuery);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'user-1', name: 'Front Desk' } },
};
const summary = { visit: { id: 1, visitNumber: 'VST-1001' } } as VisitSummary;
const forbidden = () =>
  NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN });

function request() {
  return new NextRequest('http://localhost/api/v1/visits/1/summary');
}

function context(id = '1') {
  return { params: Promise.resolve({ id }) };
}

describe('Visit summary route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    getSummary.mockResolvedValue({ success: true, data: summary });
  });

  it('should return unauthorized without reading the summary', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(getSummary).not.toHaveBeenCalled();
  });

  it('should return forbidden without reading the summary when visit:read is absent', async () => {
    requirePermissions.mockResolvedValueOnce(forbidden());

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['visit:read']);
    expect(getSummary).not.toHaveBeenCalled();
  });

  it('should include billing and name the generating user when invoice:read is granted', async () => {
    const response = await GET(request(), context('7'));

    expect(response.status).toBe(StatusCodes.OK);
    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['invoice:read']);
    expect(getSummary).toHaveBeenCalledWith('7', 'tenant-1', {
      includeBilling: true,
      generatedBy: 'Front Desk',
    });
    await expect(response.json()).resolves.toEqual({ data: summary });
  });

  it('should leave billing out when invoice:read is absent', async () => {
    requirePermissions.mockResolvedValueOnce(null).mockResolvedValueOnce(forbidden());

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.OK);
    expect(getSummary).toHaveBeenCalledWith('1', 'tenant-1', {
      includeBilling: false,
      generatedBy: 'Front Desk',
    });
  });

  it('should map a missing Visit to 404', async () => {
    getSummary.mockResolvedValue({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.NOT_FOUND);
    await expect(response.json()).resolves.toEqual({
      message: 'Visit not found',
      errors: ['Visit not found'],
    });
  });

  it('should map an invalid Visit ID to 400', async () => {
    getSummary.mockResolvedValue({ success: false, errors: ['Visit abc is Invalid.'] });

    const response = await GET(request(), context('abc'));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['Visit abc is Invalid.'],
    });
  });

  it('should return 500 when the query throws', async () => {
    getSummary.mockRejectedValue(new Error('boom'));

    const response = await GET(request(), context());

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
