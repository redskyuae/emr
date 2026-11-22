import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';
import type { ListSessionsResponse } from './types';

import { recordOwnSessionsRevoked } from '@/app/api/lib/analytics/access-session-event';
import { revokeAllSessionsCommand } from '@/app/api/lib/modules/session/commands/revoke-all-sessions-command';
import { getSessionsQuery } from '@/app/api/lib/modules/session/queries/get-sessions-query';
import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
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

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    // Read first so the Audit Log can name each Session that ends.
    const others = await getSessionsQuery(session.user.id, session.session.id);
    const result = await revokeAllSessionsCommand(session.user.id, session.session.id);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    recordOwnSessionsRevoked(session, request, 'all');

    const revokedIds =
      others.success && 'total' in others
        ? others.data.filter(({ isCurrent }) => !isCurrent).map(({ id }) => id)
        : [];

    if (session.session.activeOrganizationId) {
      await recordAuditEventFor(
        {
          tenantId: session.session.activeOrganizationId,
          userId: session.user.id,
          name: session.user.name,
          email: session.user.email,
          sessionId: session.session.id,
          impersonatedBy: session.session.impersonatedBy ?? null,
        },
        request,
        'auth.session-revoke',
        { entityLabel: session.user.email, metadata: { sessionIds: revokedIds, scope: 'all' } }
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
