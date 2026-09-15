import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rescheduleAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/reschedule-appointment-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/modules/appointment/commands/reschedule-appointment-command', () => ({
  rescheduleAppointmentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantSession: vi.fn(),
}));

const reschedule = vi.mocked(rescheduleAppointmentCommand);
const requireSession = vi.mocked(requireTenantSession);
const context = { params: Promise.resolve({ id: '10' }) };
const payload = {
  bookingPath: 'PROCEDURE',
  slotDate: '31-12-2099',
  startTime: '11:00',
  endTime: '12:00',
};

function request(body: unknown) {
  return new NextRequest('http://localhost/api/v1/appointments/10/reschedule', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('Reschedule Appointment route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({ tenantId: 'tenant-1' } as never);
    reschedule.mockResolvedValue({
      success: true,
      data: { id: 10, bookingNumber: 'APT-1001', slotDate: '31-12-2099' } as never,
    });
  });

  it('should reschedule the Appointment for the active Tenant', async () => {
    const response = await POST(request(payload), context);

    expect(response.status).toBe(StatusCodes.OK);
    expect(reschedule).toHaveBeenCalledWith('10', payload, 'tenant-1');
    await expect(response.json()).resolves.toMatchObject({
      data: { id: 10, bookingNumber: 'APT-1001' },
    });
  });

  it('should return an auth response before reading the request body', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );

    const response = await POST(request(payload), context);

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(reschedule).not.toHaveBeenCalled();
  });

  it('should reject an invalid JSON request body', async () => {
    const invalidRequest = new NextRequest('http://localhost/api/v1/appointments/10/reschedule', {
      method: 'POST',
      body: '{',
    });

    const response = await POST(invalidRequest, context);

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({
      message: 'Request body must be valid JSON',
    });
    expect(reschedule).not.toHaveBeenCalled();
  });

  it('should preserve command conflict errors', async () => {
    reschedule.mockResolvedValue({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be rescheduled.'],
    });

    const response = await POST(request(payload), context);

    expect(response.status).toBe(StatusCodes.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      message: 'Only Scheduled or Confirmed Appointments can be rescheduled.',
      errors: ['Only Scheduled or Confirmed Appointments can be rescheduled.'],
    });
  });
});
