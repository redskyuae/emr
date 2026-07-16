import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/create-appointment-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/modules/appointment/commands/create-appointment-command', () => ({
  createAppointmentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
}));

const createAppointment = vi.mocked(createAppointmentCommand);
const requireSession = vi.mocked(requireTenantSession);

const tenantSession = {
  tenantId: 'tenant-1',
  session: { user: { id: 'admin-1' } },
};

const payload = {
  doctorId: 1,
  appointmentModeId: 2,
  appointmentTypeId: 3,
  appointmentReasonId: 4,
  patientId: 5,
  slotDate: '31-12-2099',
  doctorRotaId: 6,
  slotTimes: ['09:00'],
};

function jsonRequest(body: unknown) {
  return new NextRequest('http://localhost/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('Appointments route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue(tenantSession as never);
    createAppointment.mockResolvedValue({
      success: true,
      data: {
        id: 10,
        tenantId: 'tenant-1',
        bookingNumber: 'APT-1001',
        slotDate: '31-12-2099',
        rotaName: 'Morning',
        remarks: null,
        createdOn: new Date('2099-12-01T00:00:00.000Z'),
        doctor: { id: 1, name: 'Dr. Meera' },
        patient: {
          id: 5,
          mrn: 'MRN-1001',
          firstName: 'Asha',
          lastName: 'Rao',
          phone: '9876543210',
          registrationStatus: 'registered',
        },
        appointmentMode: { id: 2, name: 'In-person', code: 'INP' },
        appointmentType: { id: 3, name: 'Consultation', code: 'CONS' },
        appointmentReason: { id: 4, name: 'Follow-up', code: 'FUP' },
        appointmentStatus: { id: 7, name: 'Scheduled', code: 'SCH', category: 'scheduled' },
        slots: [{ slotTime: '09:00', status: 'Booked' }],
      },
    });
  });

  it('should return an auth response without reading the request body', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await POST(jsonRequest(payload));

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('should reject invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/v1/appointments', {
      method: 'POST',
      body: '{',
    });

    const response = await POST(request);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
  });

  it('should call the command with parsed body and tenant id', async () => {
    const response = await POST(jsonRequest(payload));

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(createAppointment).toHaveBeenCalledWith(payload, 'tenant-1');
    await expect(response.json()).resolves.toMatchObject({
      data: { id: 10, bookingNumber: 'APT-1001' },
    });
  });

  it('should include patient matches on conflict responses', async () => {
    const patientMatches = [
      {
        id: 8,
        mrn: 'MRN-1008',
        firstName: 'Asha',
        lastName: 'Rao',
        phone: '9876543210',
        isActive: true,
        registrationStatus: 'registered' as const,
      },
    ];
    createAppointment.mockResolvedValue({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Potential Patient match found. Retry with patientId.'],
      patientMatches,
    });

    const response = await POST(jsonRequest(payload));

    expect(response.status).toBe(StatusCodes.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      message: 'Conflict',
      errors: ['Potential Patient match found. Retry with patientId.'],
      patientMatches,
    });
  });
});
