import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetTherapistResponse, UpdateTherapistResponse } from './types';

import { updateTherapistCommand } from '@/app/api/lib/modules/therapist/commands/update-therapist-command';
import { getTherapistByIdQuery } from '@/app/api/lib/modules/therapist/queries/get-therapist-by-id-query';
import { requireTenantAdminSession, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type RouteContext = { params: Promise<{ id: string }> };
function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) return 'Therapist not found';
  if (status === StatusCodes.CONFLICT && errors.length === 1) return errors[0];
  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;
    const result = await getTherapistByIdQuery((await context.params).id, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<GetTherapistResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const result = await updateTherapistCommand(
      (await context.params).id,
      session.tenantId,
      payload
    );
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<UpdateTherapistResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
