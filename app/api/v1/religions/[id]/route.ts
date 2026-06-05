import { type NextRequest, NextResponse } from 'next/server';

import { deleteReligionCommand } from '@/app/api/lib/modules/religion/commands/delete-religion-command';
import { updateReligionCommand } from '@/app/api/lib/modules/religion/commands/update-religion-command';
import { getReligionByIdQuery } from '@/app/api/lib/modules/religion/queries/get-religion-by-id-query';
import type { Religion } from '@/app/api/lib/modules/religion/schemas/religion-schema';

type ReligionRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateReligionRequest = {
  name: string;
  code: string;
};

export type ReligionResponse = {
  data: Religion;
};

function errorMessage(status: number) {
  if (status === 404) {
    return 'Religion not found';
  }

  if (status === 409) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: ReligionRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getReligionByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<ReligionResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: ReligionRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateReligionCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<ReligionResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: ReligionRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteReligionCommand(id);

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
