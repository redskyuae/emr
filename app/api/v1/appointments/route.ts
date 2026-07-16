import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { createAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/create-appointment-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { CreateAppointmentResponse } from './types';

export async function POST(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await createAppointmentCommand(payload, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message: status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed',
          errors: result.errors,
          ...(result.patientMatches ? { patientMatches: result.patientMatches } : {}),
        },
        { status }
      );
    }

    return NextResponse.json<CreateAppointmentResponse>(
      { data: result.data },
      { status: StatusCodes.CREATED }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
