import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cancelAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/cancel-appointment-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';

vi.mock('@/app/api/lib/modules/appointment/commands/cancel-appointment-command', () => ({
  cancelAppointmentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({ requireTenantSession: vi.fn() }));

const cancelAppointment = vi.mocked(cancelAppointmentCommand);
const requireSession = vi.mocked(requireTenantSession);

function request(body: unknown) {
  return new NextRequest('http://localhost/api/v1/appointments/12/cancel', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const context = { params: Promise.resolve({ id: '12' }) };

describe('Cancel Appointment route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSession.mockResolvedValue({ tenantId: 'tenant-1' } as never);
    cancelAppointment.mockResolvedValue({
      success: true,
      data: {
        id: 12,
        bookingNumber: 'APT-1012',
        appointmentStatus: { category: 'cancelled' },
      } as never,
    });
  });

  it('should cancel an Appointment in the active Tenant', async () => {
    const response = await POST(request({ appointmentCancelledReasonId: 7 }), context);

    expect(response.status).toBe(StatusCodes.OK);
    await expect(response.json()).resolves.toMatchObject({
      data: { id: 12, bookingNumber: 'APT-1012' },
    });
    expect(cancelAppointment).toHaveBeenCalledWith(
      '12',
      { appointmentCancelledReasonId: 7 },
      'tenant-1'
    );
  });

  it('should authenticate before reading the request body', async () => {
    requireSession.mockResolvedValue(
      NextResponse.json({ message: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED })
    );
    const unreadableRequest = { json: vi.fn() } as never;

    const response = await POST(unreadableRequest, context);

    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it('should reject an invalid JSON body', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/v1/appointments/12/cancel', {
        method: 'POST',
        body: '{invalid',
      }),
      context
    );

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    await expect(response.json()).resolves.toEqual({ message: 'Request body must be valid JSON' });
    expect(cancelAppointment).not.toHaveBeenCalled();
  });

  it('should return exact conflict details from the command', async () => {
    cancelAppointment.mockResolvedValue({
      success: false,
      status: StatusCodes.CONFLICT,
      errors: ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    });

    const response = await POST(request({ appointmentCancelledReasonId: 7 }), context);

    expect(response.status).toBe(StatusCodes.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      message: 'Only Scheduled or Confirmed Appointments can be cancelled.',
      errors: ['Only Scheduled or Confirmed Appointments can be cancelled.'],
    });
  });
});
