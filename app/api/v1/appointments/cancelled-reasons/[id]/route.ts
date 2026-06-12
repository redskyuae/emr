import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { deleteAppointmentCancelledReasonCommand } from '@/app/api/lib/modules/appointment-cancelled-reason/commands/delete-appointment-cancelled-reason-command';
import { updateAppointmentCancelledReasonCommand } from '@/app/api/lib/modules/appointment-cancelled-reason/commands/update-appointment-cancelled-reason-command';
import { getAppointmentCancelledReasonByIdQuery } from '@/app/api/lib/modules/appointment-cancelled-reason/queries/get-appointment-cancelled-reason-by-id-query';
import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';

type AppointmentCancelledReasonRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateAppointmentCancelledReasonRequest = {
  tenantId: string;
  name: string;
  code: string;
  description?: string | null;
};

export type AppointmentCancelledReasonResponse = {
  data: AppointmentCancelledReason;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Appointment cancelled reason not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

function getTenantId(request: NextRequest) {
  // TODO: extract tenantId from BetterAuth session once auth is implemented.
  return request.nextUrl.searchParams.get('tenantId');
}

export async function GET(request: NextRequest, context: AppointmentCancelledReasonRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getAppointmentCancelledReasonByIdQuery(id, getTenantId(request));

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentCancelledReasonResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: AppointmentCancelledReasonRouteContext) {
  try {
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

    const result = await updateAppointmentCancelledReasonCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentCancelledReasonResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: AppointmentCancelledReasonRouteContext
) {
  try {
    const { id } = await context.params;
    const result = await deleteAppointmentCancelledReasonCommand(id, getTenantId(request));

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
