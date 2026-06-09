import { type NextRequest, NextResponse } from 'next/server';

import { createAppointmentStatusCommand } from '@/app/api/lib/modules/appointment-status/commands/create-appointment-status-command';
import { getAppointmentStatusesQuery } from '@/app/api/lib/modules/appointment-status/queries/get-appointment-statuses-query';
import type { AppointmentStatus } from '@/app/api/lib/modules/appointment-status/schemas/appointment-status-schema';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { Paginated } from '@/app/api/lib/utils/types';

export type SaveAppointmentStatusRequest = {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
};

export type SaveAppointmentStatusResponse = {
  data: AppointmentStatus;
};

function mutationMessage(status: number, errors: string[]) {
  if (status === 409 && errors.length === 1) {
    return errors[0];
  }

  return status === 409 ? 'Conflict' : 'Validation failed';
}

function getTenantId(request: NextRequest) {
  // TODO: extract tenantId from BetterAuth session once auth is implemented.
  return request.nextUrl.searchParams.get('tenantId');
}

export async function GET(request: NextRequest) {
  try {
    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);
    const tenantId = getTenantId(request);
    const query =
      request.nextUrl.searchParams.get('query')?.trim() ||
      request.nextUrl.searchParams.get('search')?.trim() ||
      undefined;

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getAppointmentStatusesQuery({
      tenantId,
      page: safePage,
      limit: safeLimit,
      query,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: queryResult.errors },
        { status: queryResult.status ?? 400 }
      );
    }

    if (!('total' in queryResult)) {
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }

    const { data, total } = queryResult;
    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

    return NextResponse.json<Paginated<AppointmentStatus>>({
      data,
      meta: {
        total,
        totalPages,
        pageSize: safeLimit,
        pageNumber: safePage,
      },
    });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await createAppointmentStatusCommand(payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveAppointmentStatusResponse>({ data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
