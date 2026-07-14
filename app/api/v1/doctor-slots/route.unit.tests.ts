import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDoctorSlotsQuery } from '@/app/api/lib/modules/doctor-schedule/queries/get-doctor-slots-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET } from './route';

vi.mock('@/app/api/lib/modules/doctor-schedule/queries/get-doctor-slots-query', () => ({
  getDoctorSlotsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
}));

const getDoctorSlots = vi.mocked(getDoctorSlotsQuery);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'admin-1' } },
};

describe('Doctor slots route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    getDoctorSlots.mockResolvedValue({ success: true, data: [], total: 0 });
  });

  it('should normalize missing query params to undefined before validation', async () => {
    await GET(new NextRequest('http://localhost/api/v1/doctor-slots'));

    expect(getDoctorSlots).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      doctorId: undefined,
      slotDate: undefined,
    });
  });

  it('should only use doctorId for doctor filtering', async () => {
    await GET(
      new NextRequest(
        'http://localhost/api/v1/doctor-slots?doctorId=7&clinicianId=8&slotDate=2026-07-15'
      )
    );

    expect(getDoctorSlots).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      doctorId: '7',
      slotDate: '2026-07-15',
    });
  });

  it('should return an auth response without calling the slots query', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(new NextRequest('http://localhost/api/v1/doctor-slots'));

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(getDoctorSlots).not.toHaveBeenCalled();
  });
});
