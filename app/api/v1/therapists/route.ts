import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListTherapistsResponse, SaveTherapistResponse } from './types';

import { createTherapistCommand } from '@/app/api/lib/modules/therapist/commands/create-therapist-command';
import { getTherapistsQuery } from '@/app/api/lib/modules/therapist/queries/get-therapists-query';
import { requireTenantAdminSession, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';

function mutationMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND)
    return errors.includes('Therapist role not found')
      ? 'Therapist role not found'
      : 'Therapist not found';
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
    const skillParam = request.nextUrl.searchParams.get('therapistSkillId');
    const therapistSkillId =
      skillParam && /^\d+$/.test(skillParam) ? Number(skillParam) : undefined;
    const statusParam = request.nextUrl.searchParams.get('status');
    const status = statusParam === 'active' || statusParam === 'inactive' ? statusParam : undefined;
    const result = await getTherapistsQuery({
      page,
      limit,
      query: request.nextUrl.searchParams.get('query')?.trim() || undefined,
      status,
      therapistSkillId,
      tenantId: session.tenantId,
    });
    if (!result.success)
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    return NextResponse.json<ListTherapistsResponse>({
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
    const result = await createTherapistCommand(payload, session.tenantId, session.session.user.id);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<SaveTherapistResponse>(
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
