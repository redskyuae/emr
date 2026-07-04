import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetNationalityResponse, UpdateNationalityResponse } from './types';

import { deleteNationalityCommand } from '@/app/api/lib/modules/nationality/commands/delete-nationality-command';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import { updateNationalityCommand } from '@/app/api/lib/modules/nationality/commands/update-nationality-command';
import { getNationalityByIdQuery } from '@/app/api/lib/modules/nationality/queries/get-nationality-by-id-query';

type NationalityRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Nationality not found';
  }

  if (status === StatusCodes.CONFLICT) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: NationalityRouteContext) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    const { id } = await context.params;
    const result = await getNationalityByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetNationalityResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: NationalityRouteContext) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await updateNationalityCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<UpdateNationalityResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(_request: NextRequest, context: NationalityRouteContext) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) return session;
    const { id } = await context.params;
    const result = await deleteNationalityCommand(id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
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
