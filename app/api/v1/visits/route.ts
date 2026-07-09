import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { CreateVisitResponse, ListVisitsResponse } from './types';

import { createVisitCommand } from '@/app/api/lib/modules/visit/commands/create-visit-command';
import { getVisitsQuery } from '@/app/api/lib/modules/visit/queries/get-visits-query';
import { VISIT_STATUS_CATEGORIES } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import type { VisitStatusCategory } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

function parseVisitStatusCategory(value: string | null): VisitStatusCategory | undefined {
  return VISIT_STATUS_CATEGORIES.find((category) => category === value);
}

function parseSortOrder(value: string | null): 'asc' | 'desc' | undefined {
  return value === 'asc' || value === 'desc' ? value : undefined;
}

function parseOptionalPositiveInteger(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isNaN(parsedValue) || parsedValue < 1 ? undefined : parsedValue;
}

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
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));
    const query = request.nextUrl.searchParams.get('query')?.trim() || undefined;

    const result = await getVisitsQuery({
      tenantId: tenantSession.tenantId,
      page: safePage,
      limit: safeLimit,
      query,
      statusId: parseOptionalPositiveInteger(request.nextUrl.searchParams.get('statusId')),
      statusCategory: parseVisitStatusCategory(request.nextUrl.searchParams.get('statusCategory')),
      doctorId: parseOptionalPositiveInteger(request.nextUrl.searchParams.get('doctorId')),
      patientId: parseOptionalPositiveInteger(request.nextUrl.searchParams.get('patientId')),
      sortOrder: parseSortOrder(request.nextUrl.searchParams.get('sortOrder')),
    });

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    const totalPages = result.total > 0 ? Math.ceil(result.total / safeLimit) : 0;

    return NextResponse.json<ListVisitsResponse>({
      data: result.data,
      meta: { total: result.total, totalPages, pageSize: safeLimit, pageNumber: safePage },
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

    const result = await createVisitCommand(payload, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<CreateVisitResponse>(
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
