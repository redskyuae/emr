import { type NextRequest, NextResponse } from 'next/server';

import { deleteAppointmentStatusCommand } from '@/app/api/lib/modules/appointment-status/commands/delete-appointment-status-command';
import { updateAppointmentStatusCommand } from '@/app/api/lib/modules/appointment-status/commands/update-appointment-status-command';
import { getAppointmentStatusByIdQuery } from '@/app/api/lib/modules/appointment-status/queries/get-appointment-status-by-id-query';
import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';

type AppointmentStatusRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateAppointmentStatusRequest = {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
};

export type AppointmentStatusResponse = {
  data: AppointmentStatus;
};

function errorMessage(status: number, errors: string[]) {
  if (status === 404) {
    return 'Appointment status not found';
  }

  if (status === 409 && errors.length === 1) {
    return errors[0];
  }

  return status === 409 ? 'Conflict' : 'Validation failed';
}

function getTenantId(request: NextRequest) {
  // TODO: extract tenantId from BetterAuth session once auth is implemented.
  return request.nextUrl.searchParams.get('tenantId');
}

export async function GET(request: NextRequest, context: AppointmentStatusRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getAppointmentStatusByIdQuery(id, getTenantId(request));

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentStatusResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: AppointmentStatusRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateAppointmentStatusCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentStatusResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: AppointmentStatusRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteAppointmentStatusCommand(id, getTenantId(request));

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
