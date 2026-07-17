import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListVisitTypesResponse, SaveVisitTypeResponse } from './types';

import { createVisitTypeCommand } from '@/app/api/lib/modules/visit-type/commands/create-visit-type-command';
import { getVisitTypesQuery } from '@/app/api/lib/modules/visit-type/queries/get-visit-types-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

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

    const queryResult = await getVisitTypesQuery({
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

    return NextResponse.json<ListVisitTypesResponse>({
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

    const result = await createVisitTypeCommand(payload, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveVisitTypeResponse>(
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
