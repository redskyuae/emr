import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetLanguageResponse, UpdateLanguageResponse } from './types';

import { deleteLanguageCommand } from '@/app/api/lib/modules/language/commands/delete-language-command';
import { updateLanguageCommand } from '@/app/api/lib/modules/language/commands/update-language-command';
import { getLanguageByIdQuery } from '@/app/api/lib/modules/language/queries/get-language-by-id-query';

type LanguageRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Language not found';
  }

  if (status === StatusCodes.CONFLICT) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: LanguageRouteContext) {
  try {
    const authSession = await requireAuth();
    if (authSession instanceof Response) return authSession;

    const { id } = await context.params;
    const result = await getLanguageByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetLanguageResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: LanguageRouteContext) {
  try {
    const authSession = await requireAuth();
    if (authSession instanceof Response) return authSession;

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

    const result = await updateLanguageCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<UpdateLanguageResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(_request: NextRequest, context: LanguageRouteContext) {
  try {
    const authSession = await requireAuth();
    if (authSession instanceof Response) return authSession;

    const { id } = await context.params;
    const result = await deleteLanguageCommand(id);

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
