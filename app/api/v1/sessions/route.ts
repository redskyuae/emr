import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';
import type { ListSessionsResponse } from './types';

import { revokeAllSessionsCommand } from '@/app/api/lib/modules/session/commands/revoke-all-sessions-command';
import { getSessionsQuery } from '@/app/api/lib/modules/session/queries/get-sessions-query';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';

export async function GET() {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const result = await getSessionsQuery(session.user.id, session.session.id);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<ListSessionsResponse>({
      data: result.data,
      meta: { total: result.total },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const result = await revokeAllSessionsCommand(session.user.id, session.session.id);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
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
