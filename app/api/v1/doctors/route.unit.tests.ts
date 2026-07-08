import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createDoctorCommand } from '@/app/api/lib/modules/doctor/commands/create-doctor-command';
import { getDoctorsQuery } from '@/app/api/lib/modules/doctor/queries/get-doctors-query';
import { requireTenantAdminSession, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { GET, POST } from './route';

vi.mock('@/app/api/lib/modules/doctor/commands/create-doctor-command', () => ({
  createDoctorCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/doctor/queries/get-doctors-query', () => ({
  getDoctorsQuery: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
  requireTenantAdminSession: vi.fn(),
}));

const createDoctor = vi.mocked(createDoctorCommand);
const getDoctors = vi.mocked(getDoctorsQuery);
const requireSession = vi.mocked(requireTenantSession);
const requireAdmin = vi.mocked(requireTenantAdminSession);

const doctor = {
  id: 1,
  name: 'Anita Mehta',
  email: 'anita@example.com',
  phone: null,
  userId: 'user-1',
  tenantId: 'tenant-1',
  isActive: true,
  staffCode: null,
  createdOn: new Date(),
  modifiedOn: new Date(),
  specialtyId: 7,
  dateOfBirth: null,
  designation: null,
  gender: null,
  specialtyName: 'Cardiology',
  qualifications: null,
  registrationNumber: 'TN-123',
};

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'admin-1' } },
};

describe('Doctor collection route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    requireAdmin.mockResolvedValue(tenantSession as never);
    getDoctors.mockResolvedValue({ success: true, data: [doctor], total: 1 });
    createDoctor.mockResolvedValue({ success: true, data: doctor });
  });

  it('should return an auth response without calling the list query', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await GET(new NextRequest('http://localhost/api/v1/doctors'));

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(getDoctors).not.toHaveBeenCalled();
  });

  it('should parse pagination, search alias, Specialty, and status filters', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/v1/doctors?page=2&limit=5&search=Anita&specialtyId=7&status=active'
      )
    );

    expect(getDoctors).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      query: 'Anita',
      status: 'active',
      tenantId: 'tenant-1',
      specialtyId: 7,
    });
    expect(await response.json()).toMatchObject({
      data: [{ id: 1 }],
      meta: { total: 1, totalPages: 1, pageSize: 5, pageNumber: 2 },
    });
  });

  it('should reject malformed create JSON before calling the command', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/v1/doctors', {
        method: 'POST',
        body: '{bad json',
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect(await response.json()).toEqual({ message: 'Request body must be valid JSON' });
    expect(createDoctor).not.toHaveBeenCalled();
  });

  it('should map a duplicate registration conflict message', async () => {
    createDoctor.mockResolvedValue({
      success: false,
      errors: ['Doctor registration number TN-123 already exists.'],
      status: StatusCodes.CONFLICT,
    });

    const response = await POST(
      new NextRequest('http://localhost/api/v1/doctors', {
        method: 'POST',
        body: JSON.stringify({ name: 'Anita' }),
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(response.status).toBe(StatusCodes.CONFLICT);
    expect(await response.json()).toEqual({
      message: 'Doctor registration number TN-123 already exists.',
      errors: ['Doctor registration number TN-123 already exists.'],
    });
  });
});
