import { type NextRequest, NextResponse } from 'next/server';

import { deleteNationalityCommand } from '@/app/api/lib/modules/nationality/commands/delete-nationality-command';
import { updateNationalityCommand } from '@/app/api/lib/modules/nationality/commands/update-nationality-command';
import { getNationalityByIdQuery } from '@/app/api/lib/modules/nationality/queries/get-nationality-by-id-query';
import type { Nationality } from '@/app/api/lib/modules/nationality/schemas/nationality-schema';

type NationalityRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateNationalityRequest = {
  name: string;
  code: string;
};

export type NationalityResponse = {
  data: Nationality;
};

function errorMessage(status: number) {
  if (status === 404) {
    return 'Nationality not found';
  }

  if (status === 409) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: NationalityRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getNationalityByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<NationalityResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: NationalityRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateNationalityCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<NationalityResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: NationalityRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteNationalityCommand(id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
