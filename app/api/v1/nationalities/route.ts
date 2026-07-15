import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListNationalitiesResponse, SaveNationalityResponse } from './types';

import { createNationalityCommand } from '@/app/api/lib/modules/nationality/commands/create-nationality-command';
import { getNationalitiesQuery } from '@/app/api/lib/modules/nationality/queries/get-nationalities-query';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

function mutationMessage(status: number) {
  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);
    const query =
      request.nextUrl.searchParams.get('query')?.trim() ||
      request.nextUrl.searchParams.get('search')?.trim() ||
      undefined;

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getNationalitiesQuery({ page: safePage, limit: safeLimit, query });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Internal Server Error', errors: queryResult.errors },
        { status: queryResult.status ?? StatusCodes.INTERNAL_SERVER_ERROR }
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

    return NextResponse.json<ListNationalitiesResponse>({
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
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
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

    const result = await createNationalityCommand(payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveNationalityResponse>(
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
