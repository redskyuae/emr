import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListBedsResponse, SaveBedResponse } from './types';

import { createBedCommand } from '@/app/api/lib/modules/bed/commands/create-bed-command';
import { getBedsQuery } from '@/app/api/lib/modules/bed/queries/get-beds-query';
import type { BedStatus } from '@/app/api/lib/modules/bed/schemas/bed-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import { BED_STATUSES } from '@/app/db/schema/bed';

function mutationMessage(status: number, errors: string[]) {
  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

function parseOptionalPositiveInteger(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return undefined;
  }

  return parsedValue;
}

function parseBedStatus(value: string | null) {
  if (!value) {
    return undefined;
  }

  const upperCased = value.trim().toUpperCase();

  return BED_STATUSES.find((status) => status === upperCased) as BedStatus | undefined;
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
    const wardId = parseOptionalPositiveInteger(request.nextUrl.searchParams.get('wardId'));
    const status = parseBedStatus(request.nextUrl.searchParams.get('status'));

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getBedsQuery({
      tenantId: tenantSession.tenantId,
      page: safePage,
      limit: safeLimit,
      query,
      wardId,
      status,
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

    return NextResponse.json<ListBedsResponse>({
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

    const result = await createBedCommand(payload, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveBedResponse>(
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
