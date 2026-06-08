import { type NextRequest, NextResponse } from 'next/server';

import { createStateCommand } from '@/app/api/lib/modules/state/commands/create-state-command';
import { getStatesQuery } from '@/app/api/lib/modules/state/queries/get-states-query';
import type { State } from '@/app/api/lib/modules/state/schemas/state-schema';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { Paginated } from '@/app/api/lib/utils/types';

export type SaveStateRequest = {
  name: string;
  countryId: number;
};

export type SaveStateResponse = {
  data: State;
};

function mutationMessage(status: number) {
  return status === 409 ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest) {
  try {
    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);
    const query =
      request.nextUrl.searchParams.get('query')?.trim() ||
      request.nextUrl.searchParams.get('search')?.trim() ||
      undefined;
    const rawCountryId = request.nextUrl.searchParams.get('countryId');
    const countryId = rawCountryId === null ? undefined : Number(rawCountryId);

    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getStatesQuery({
      page: safePage,
      limit: safeLimit,
      query,
      countryId,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: queryResult.errors },
        { status: queryResult.status ?? 400 }
      );
    }

    const { data, total } = queryResult;
    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

    return NextResponse.json<Paginated<State>>({
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

    const result = await createStateCommand(payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: mutationMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveStateResponse>({ data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
