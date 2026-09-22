import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListTherapistSkillsResponse, SaveTherapistSkillResponse } from './types';

import { createTherapistSkillCommand } from '@/app/api/lib/modules/therapist-skill/commands/create-therapist-skill-command';
import { getTherapistSkillsQuery } from '@/app/api/lib/modules/therapist-skill/queries/get-therapist-skills-query';
import { requireTenantAdminSession, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

function mutationMessage(status: number, errors: string[]) {
  if (status === StatusCodes.CONFLICT && errors.length === 1) return errors[0];
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
    const result = await getTherapistSkillsQuery({
      page,
      limit,
      query: request.nextUrl.searchParams.get('query')?.trim() || undefined,
      tenantId: session.tenantId,
    });
    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }
    return NextResponse.json<ListTherapistSkillsResponse>({
      data: result.data,
      meta: {
        total: result.total,
        totalPages: result.total ? Math.ceil(result.total / limit) : 0,
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

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenantAdminSession();
    if (session instanceof Response) return session;
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }
    const result = await createTherapistSkillCommand(payload, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<SaveTherapistSkillResponse>(
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
