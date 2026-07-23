import { StatusCodes } from 'http-status-codes';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetCountryResponse, UpdateCountryResponse } from './types';

import { deleteCountryCommand } from '@/app/api/lib/modules/country/commands/delete-country-command';
import { updateCountryCommand } from '@/app/api/lib/modules/country/commands/update-country-command';
import { getCountryByIdQuery } from '@/app/api/lib/modules/country/queries/get-country-by-id-query';

type CountryRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Country not found';
  }

  if (status === StatusCodes.CONFLICT) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: CountryRouteContext) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    const result = await getCountryByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetCountryResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: CountryRouteContext) {
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

    const result = await updateCountryCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<UpdateCountryResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(_request: NextRequest, context: CountryRouteContext) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    const result = await deleteCountryCommand(id);

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
