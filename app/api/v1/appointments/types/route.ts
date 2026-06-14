import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { createAppointmentTypeCommand } from '@/app/api/lib/modules/appointment-type/commands/create-appointment-type-command';
import { getAppointmentTypesQuery } from '@/app/api/lib/modules/appointment-type/queries/get-appointment-types-query';
import type { AppointmentType } from '@/app/api/lib/modules/appointment-type/schemas/appointment-type-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { Paginated } from '@/app/api/lib/utils/types';

export type SaveAppointmentTypeRequest = {
  tenantId: string;
  name: string;
  code: string;
  description?: string | null;
};

export type SaveAppointmentTypeResponse = {
  data: AppointmentType;
};

function mutationMessage(status: number, errors: string[]) {
  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);
    const query =
      request.nextUrl.searchParams.get('query')?.trim() ||
      request.nextUrl.searchParams.get('search')?.trim() ||
      undefined;

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getAppointmentTypesQuery({
      tenantId: tenantSession.tenantId,
      page: safePage,
      limit: safeLimit,
      query,
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

    return NextResponse.json<Paginated<AppointmentType>>({
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

    if (payload && typeof payload === 'object') {
      // @ts-expect-error Safe assignment to force the tenantId
      payload.tenantId = tenantSession.tenantId;
    }

    const result = await createAppointmentTypeCommand(payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveAppointmentTypeResponse>(
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
