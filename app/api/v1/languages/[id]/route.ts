import { type NextRequest, NextResponse } from 'next/server';

import { deleteLanguageCommand } from '@/app/api/lib/modules/language/commands/delete-language-command';
import { updateLanguageCommand } from '@/app/api/lib/modules/language/commands/update-language-command';
import { getLanguageByIdQuery } from '@/app/api/lib/modules/language/queries/get-language-by-id-query';
import type { Language } from '@/app/api/lib/modules/language/schemas/language-schema';

type LanguageRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateLanguageRequest = {
  name: string;
  code: string;
};

export type LanguageResponse = {
  data: Language;
};

function errorMessage(status: number) {
  if (status === 404) {
    return 'Language not found';
  }

  if (status === 409) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: LanguageRouteContext) {
  try {
    const { id } = await context.params;
    const result = await getLanguageByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<LanguageResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: LanguageRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateLanguageCommand(id, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<LanguageResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: LanguageRouteContext) {
  try {
    const { id } = await context.params;
    const result = await deleteLanguageCommand(id);

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
