import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListCountriesResponse, SaveCountryResponse } from './types';

import { createCountryCommand } from '@/app/api/lib/modules/country/commands/create-country-command';
import { getCountriesQuery } from '@/app/api/lib/modules/country/queries/get-countries-query';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

function mutationMessage(status: number) {
  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  try {
    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);
    const query =
      request.nextUrl.searchParams.get('query')?.trim() ||
      request.nextUrl.searchParams.get('search')?.trim() ||
      undefined;

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getCountriesQuery({ page: safePage, limit: safeLimit, query });

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

    return NextResponse.json<ListCountriesResponse>({
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
  const session = await requireAuth();
  if (session instanceof Response) return session;

  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await createCountryCommand(payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveCountryResponse>(
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
