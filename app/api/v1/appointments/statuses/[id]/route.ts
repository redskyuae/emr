import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { deleteAppointmentStatusCommand } from '@/app/api/lib/modules/appointment-status/commands/delete-appointment-status-command';
import { updateAppointmentStatusCommand } from '@/app/api/lib/modules/appointment-status/commands/update-appointment-status-command';
import { getAppointmentStatusByIdQuery } from '@/app/api/lib/modules/appointment-status/queries/get-appointment-status-by-id-query';
import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

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
  if (status === StatusCodes.NOT_FOUND) {
    return 'Appointment status not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest, context: AppointmentStatusRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getAppointmentStatusByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentStatusResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: AppointmentStatusRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

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

    if (typeof payload === 'object' && payload !== null) {
      (payload as Record<string, unknown>).tenantId = tenantSession.tenantId;
    }

    const result = await updateAppointmentStatusCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<AppointmentStatusResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(request: NextRequest, context: AppointmentStatusRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await deleteAppointmentStatusCommand(id, tenantSession.tenantId);

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
