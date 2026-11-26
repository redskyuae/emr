import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { rescheduleAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/reschedule-appointment-command';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { RescheduleAppointmentResponse } from './types';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { appointmentRescheduledProperties } from '@/app/api/lib/analytics/lifecycle-appointment-properties';

type AppointmentRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) return 'Appointment not found';
  if (status === StatusCodes.CONFLICT && errors.length === 1) return errors[0];
  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function POST(request: NextRequest, context: AppointmentRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) return tenantSession;

    const denied = await requireTenantPermissions(tenantSession, ['appointment:reschedule']);
    if (denied) return denied;

    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await rescheduleAppointmentCommand(id, payload, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'appointment_rescheduled', () =>
      appointmentRescheduledProperties(result.data, result.doctorChanged, result.timeZone)
    );

    return NextResponse.json<RescheduleAppointmentResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
