import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetTherapistSkillResponse, UpdateTherapistSkillResponse } from './types';

import { deleteTherapistSkillCommand } from '@/app/api/lib/modules/therapist-skill/commands/delete-therapist-skill-command';
import { updateTherapistSkillCommand } from '@/app/api/lib/modules/therapist-skill/commands/update-therapist-skill-command';
import { getTherapistSkillByIdQuery } from '@/app/api/lib/modules/therapist-skill/queries/get-therapist-skill-by-id-query';
import { requireTenantAdminSession, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type RouteContext = { params: Promise<{ id: string }> };

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) return 'Therapist Skill not found';
  if (status === StatusCodes.CONFLICT && errors.length === 1) return errors[0];
  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireTenantSession();
    if (session instanceof Response) return session;
    const result = await getTherapistSkillByIdQuery((await context.params).id, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return NextResponse.json<GetTherapistSkillResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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
    const result = await updateTherapistSkillCommand(
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
    return NextResponse.json<UpdateTherapistSkillResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireTenantAdminSession();
    if (session instanceof Response) return session;
    const result = await deleteTherapistSkillCommand((await context.params).id, session.tenantId);
    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }
    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
