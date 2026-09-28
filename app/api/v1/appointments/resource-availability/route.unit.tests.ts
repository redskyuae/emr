import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProcedureResourceAvailabilityQuery } from '@/app/api/lib/modules/appointment/queries/get-procedure-resource-availability-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock(
  '@/app/api/lib/modules/appointment/queries/get-procedure-resource-availability-query',
  () => ({ getProcedureResourceAvailabilityQuery: vi.fn() })
);
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const getAvailability = vi.mocked(getProcedureResourceAvailabilityQuery);
const requireSession = vi.mocked(requireTenantSession);

function request(search = '') {
  return new NextRequest(`http://localhost/api/v1/appointments/resource-availability${search}`);
}

describe('Procedure resource availability route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({
      tenantId: 'tenant-1',
      session: { user: { id: 'admin-1' } },
    } as never);
    getAvailability.mockResolvedValue({
      success: true,
      data: { roomIds: [4], therapistIds: [8], patientUnavailable: true },
    });
  });

  it('should return an auth response without reading availability', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(request());

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(getAvailability).not.toHaveBeenCalled();
  });

  it('should pass the requested window and active Tenant to the query', async () => {
    const response = await GET(
      request('?slotDate=31-12-2099&startTime=10%3A00&endTime=11%3A00&patientId=12')
    );

    expect(getAvailability).toHaveBeenCalledWith(
      { slotDate: '31-12-2099', startTime: '10:00', endTime: '11:00', patientId: '12' },
      'tenant-1'
    );
    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toEqual({
      data: { roomIds: [4], therapistIds: [8], patientUnavailable: true },
    });
  });

  it('should map validation failures to their status', async () => {
    getAvailability.mockResolvedValue({
      success: false,
      status: StatusCodes.BAD_REQUEST,
      errors: ['End time must be after start time'],
    });

    const response = await GET(request('?slotDate=31-12-2099&startTime=11%3A00&endTime=10%3A00'));

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Validation failed',
      errors: ['End time must be after start time'],
    });
  });

  it('should hide unexpected errors behind a 500 response', async () => {
    getAvailability.mockRejectedValue(new Error('database failed'));

    const response = await GET(request('?slotDate=31-12-2099&startTime=10%3A00&endTime=11%3A00'));

    expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({ message: 'Internal Server Error' });
  });
});
