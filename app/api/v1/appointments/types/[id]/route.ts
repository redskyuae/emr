import { type NextRequest, NextResponse } from 'next/server';

import { deleteAppointmentTypeCommand } from '@/app/api/lib/modules/appointment-type/commands/delete-appointment-type-command';
import { updateAppointmentTypeCommand } from '@/app/api/lib/modules/appointment-type/commands/update-appointment-type-command';
import { getAppointmentTypeByIdQuery } from '@/app/api/lib/modules/appointment-type/queries/get-appointment-type-by-id-query';
import type { AppointmentType } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';

type AppointmentTypeRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateAppointmentTypeRequest = {
  tenantId: string;
  name: string;
  code: string;
  description?: string | null;
};

export type AppointmentTypeResponse = {
  data: AppointmentType;
};

function errorMessage(status: number, errors: string[]) {
  if (status === 404) {
    return 'Appointment type not found';
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

export async function GET(request: NextRequest, context: AppointmentTypeRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getAppointmentTypeByIdQuery(id, getTenantId(request));

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentTypeResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: AppointmentTypeRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateAppointmentTypeCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentTypeResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: AppointmentTypeRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteAppointmentTypeCommand(id, getTenantId(request));

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
