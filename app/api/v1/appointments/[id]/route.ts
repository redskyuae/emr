import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getAppointmentByIdQuery } from '@/app/api/lib/modules/appointment/queries/get-appointment-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { GetAppointmentResponse } from './types';

type AppointmentRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: AppointmentRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getAppointmentByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message =
        status === StatusCodes.NOT_FOUND ? 'Appointment not found' : 'Validation failed';

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return NextResponse.json<GetAppointmentResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
