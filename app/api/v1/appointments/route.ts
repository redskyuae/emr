import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { createAppointmentCommand } from '@/app/api/lib/modules/appointment/commands/create-appointment-command';
import { getAppointmentsQuery } from '@/app/api/lib/modules/appointment/queries/get-appointments-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { CreateAppointmentResponse, ListAppointmentsResponse } from './types';

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInteger(searchParams.get('page'), 1);
    const limit = parsePositiveInteger(searchParams.get('limit'), 10);
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getAppointmentsQuery({
      tenantId: tenantSession.tenantId,
      filters: {
        slotDate: searchParams.get('slotDate')?.trim() || undefined,
        doctorId: searchParams.get('doctorId')?.trim() || undefined,
        patientId: searchParams.get('patientId')?.trim() || undefined,
        appointmentStatusId: searchParams.get('appointmentStatusId')?.trim() || undefined,
        query: searchParams.get('query')?.trim() || searchParams.get('search')?.trim() || undefined,
        page: safePage,
        limit: safeLimit,
      },
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: queryResult.errors },
        { status: queryResult.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    if (!('total' in queryResult)) {
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: StatusCodes.INTERNAL_SERVER_ERROR }
      );
    }

    const { data, total } = queryResult;
    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

    return NextResponse.json<ListAppointmentsResponse>({
      data,
      meta: {
        total,
        totalPages,
        pageSize: safeLimit,
        pageNumber: safePage,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

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
