import { type NextRequest, NextResponse } from 'next/server';

import { deleteAppointmentModeCommand } from '@/app/api/lib/modules/appointment-mode/commands/delete-appointment-mode-command';
import { updateAppointmentModeCommand } from '@/app/api/lib/modules/appointment-mode/commands/update-appointment-mode-command';
import { getAppointmentModeByIdQuery } from '@/app/api/lib/modules/appointment-mode/queries/get-appointment-mode-by-id-query';
import type { AppointmentMode } from '@/app/api/lib/modules/appointment-mode/schemas/appointment-mode-schema';

type AppointmentModeRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateAppointmentModeRequest = {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
};

export type AppointmentModeResponse = {
  data: AppointmentMode;
};

function errorMessage(status: number, errors: string[]) {
  if (status === 404) {
    return 'Appointment mode not found';
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

export async function GET(request: NextRequest, context: AppointmentModeRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getAppointmentModeByIdQuery(id, getTenantId(request));

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentModeResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: AppointmentModeRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateAppointmentModeCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentModeResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: AppointmentModeRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteAppointmentModeCommand(id, getTenantId(request));

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
