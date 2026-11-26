import { StatusCodes } from 'http-status-codes';
import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cancelAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/cancel-appointment-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { POST } from './route';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';

vi.mock('@/app/api/lib/analytics/lifecycle-event-recorder', () => ({
  recordLifecycleEvent: vi.fn(),
}));
vi.mock('@/app/api/lib/modules/appointment/commands/cancel-appointment-command', () => ({
  cancelAppointmentCommand: vi.fn(),
}));
vi.mock('@/app/api/lib/utils/auth-helpers', () => ({
  requireTenantPermissions: vi.fn(),
  requireTenantSession: vi.fn(),
}));

const cancelAppointment = vi.mocked(cancelAppointmentCommand);
const requirePermissions = vi.mocked(requireTenantPermissions);
const requireSession = vi.mocked(requireTenantSession);
const tenantSession = { tenantId: 'tenant-1' };

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
    requireSession.mockResolvedValue(tenantSession as never);
    requirePermissions.mockResolvedValue(null);
    cancelAppointment.mockResolvedValue({
      success: true,
      data: {
        id: 12,
        bookingNumber: 'APT-1012',
        appointmentStatus: { category: 'cancelled' },
      } as never,
      timeZone: 'Asia/Dubai',
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
    expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(recordLifecycleEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'appointment_cancelled',
      expect.any(Function)
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

  it('should require appointment:cancel', async () => {
    await POST(request({ appointmentCancelledReasonId: 7 }), context);

    expect(requirePermissions).toHaveBeenCalledWith(tenantSession, ['appointment:cancel']);
  });

  it('should return forbidden without cancelling when appointment:cancel is absent', async () => {
    requirePermissions.mockResolvedValue(
      NextResponse.json({ message: 'Forbidden' }, { status: StatusCodes.FORBIDDEN })
    );

    const response = await POST(request({ appointmentCancelledReasonId: 7 }), context);

    expect(response.status).toBe(StatusCodes.FORBIDDEN);
    await expect(response.json()).resolves.toEqual({ message: 'Forbidden' });
    expect(cancelAppointment).not.toHaveBeenCalled();
    expect(recordLifecycleEvent).not.toHaveBeenCalled();
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
    expect(recordLifecycleEvent).not.toHaveBeenCalled();
  });
});
