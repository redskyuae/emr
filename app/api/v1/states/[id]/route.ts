import { type NextRequest, NextResponse } from 'next/server';

import { deleteStateCommand } from '@/app/api/lib/modules/state/commands/delete-state-command';
import { updateStateCommand } from '@/app/api/lib/modules/state/commands/update-state-command';
import { getStateByIdQuery } from '@/app/api/lib/modules/state/queries/get-state-by-id-query';
import type { State } from '@/app/api/lib/modules/state/schemas/state-schema';

type StateRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateStateRequest = {
  name: string;
  countryId: number;
};

export type StateResponse = {
  data: State;
};

function errorMessage(status: number) {
  if (status === 404) {
    return 'State not found';
  }

  if (status === 409) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: StateRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getStateByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<StateResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: StateRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateStateCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<StateResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: StateRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteStateCommand(id);

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
