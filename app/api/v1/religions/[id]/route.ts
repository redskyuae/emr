import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import type { GetReligionResponse, UpdateReligionResponse } from './types';

import { deleteReligionCommand } from '@/app/api/lib/modules/religion/commands/delete-religion-command';
import { updateReligionCommand } from '@/app/api/lib/modules/religion/commands/update-religion-command';
import { getReligionByIdQuery } from '@/app/api/lib/modules/religion/queries/get-religion-by-id-query';

type ReligionRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Religion not found';
  }

  if (status === StatusCodes.CONFLICT) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: ReligionRouteContext) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    const result = await getReligionByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetReligionResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: ReligionRouteContext) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) {
      return session;
    }

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

    const result = await updateReligionCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<UpdateReligionResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(_request: NextRequest, context: ReligionRouteContext) {
  try {
    const session = await requireAuth();
    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    const result = await deleteReligionCommand(id);

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
