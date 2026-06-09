import { type NextRequest, NextResponse } from 'next/server';

import { deleteAppointmentReasonCommand } from '@/app/api/lib/modules/appointment-reason/commands/delete-appointment-reason-command';
import { updateAppointmentReasonCommand } from '@/app/api/lib/modules/appointment-reason/commands/update-appointment-reason-command';
import { getAppointmentReasonByIdQuery } from '@/app/api/lib/modules/appointment-reason/queries/get-appointment-reason-by-id-query';
import type { AppointmentReason } from '@/app/api/lib/modules/appointment-reason/schemas/appointment-reason-schema';

type AppointmentReasonRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateAppointmentReasonRequest = {
  tenantId: string;
  name: string;
  code: string;
  description?: string | null;
};

export type AppointmentReasonResponse = {
  data: AppointmentReason;
};

function errorMessage(status: number, errors: string[]) {
  if (status === 404) {
    return 'Appointment reason not found';
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

export async function GET(request: NextRequest, context: AppointmentReasonRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getAppointmentReasonByIdQuery(id, getTenantId(request));

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentReasonResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: AppointmentReasonRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateAppointmentReasonCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentReasonResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: AppointmentReasonRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteAppointmentReasonCommand(id, getTenantId(request));

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
