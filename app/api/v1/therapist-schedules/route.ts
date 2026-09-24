import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListTherapistSchedulesResponse, SaveTherapistScheduleResponse } from './types';

import { createTherapistScheduleCommand } from '@/app/api/lib/modules/therapist-schedule/commands/create-therapist-schedule-command';
import { updateTherapistScheduleCommand } from '@/app/api/lib/modules/therapist-schedule/commands/update-therapist-schedule-command';
import { getTherapistSchedulesQuery } from '@/app/api/lib/modules/therapist-schedule/queries/get-therapist-schedules-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

function mutationMessage(status: number, errors: string[]) {
  if ((status === StatusCodes.CONFLICT || status === StatusCodes.NOT_FOUND) && errors.length === 1)
    return errors[0];
  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;
    const page = Math.max(
      1,
      Math.floor(parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1))
    );
    const limit = Math.min(
      999,
      Math.max(1, Math.floor(parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10)))
    );
    const result = await getTherapistSchedulesQuery({
      page,
      limit,
      tenantId: session.tenantId,
      therapistId: request.nextUrl.searchParams.get('therapistId') ?? undefined,
      fromDate: request.nextUrl.searchParams.get('fromDate') ?? undefined,
      toDate: request.nextUrl.searchParams.get('toDate') ?? undefined,
    });
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }
    return NextResponse.json<ListTherapistSchedulesResponse>({
      data: result.data,
      meta: {
        total: result.total,
        totalPages: result.total > 0 ? Math.ceil(result.total / limit) : 0,
        pageSize: limit,
        pageNumber: page,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

async function readJson(request: NextRequest) {
  try {
    return { ok: true as const, payload: await request.json() };
  } catch {
    return { ok: false as const };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;
    const body = await readJson(request);
    if (!body.ok)
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    const result = await createTherapistScheduleCommand(body.payload, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<SaveTherapistScheduleResponse>(
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

export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;
    const body = await readJson(request);
    if (!body.ok)
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    const result = await updateTherapistScheduleCommand(body.payload, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<SaveTherapistScheduleResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
