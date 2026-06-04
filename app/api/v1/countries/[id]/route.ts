import { type NextRequest, NextResponse } from 'next/server';

import { deleteCountryCommand } from '@/app/api/lib/modules/country/commands/delete-country-command';
import { updateCountryCommand } from '@/app/api/lib/modules/country/commands/update-country-command';
import { getCountryByIdQuery } from '@/app/api/lib/modules/country/queries/get-country-by-id-query';
import type { Country } from '@/app/api/lib/modules/country/schemas/country-schema';

type CountryRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateCountryRequest = {
  name: string;
  code: string;
};

export type CountryResponse = {
  data: Country;
};

function errorMessage(status: number) {
  if (status === 404) {
    return 'Country not found';
  }

  if (status === 409) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: CountryRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getCountryByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<CountryResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: CountryRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateCountryCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<CountryResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: CountryRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteCountryCommand(id);

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
