import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import {
  CANNOT_REVOKE_CURRENT_SESSION_MESSAGE,
  revokeSessionCommand,
} from '@/app/api/lib/modules/session/commands/revoke-session-command';
import { recordOwnSessionsRevoked } from '@/app/api/lib/analytics/access-session-event';
import { recordAuditEventFor } from '@/app/api/lib/audit/audit-recorder';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';

type SessionRouteContext = {
  params: Promise<{ sessionId: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Session not found';
  }

  if (status === StatusCodes.FORBIDDEN) {
    return 'Forbidden';
  }

  if (status === StatusCodes.UNPROCESSABLE_ENTITY) {
    return CANNOT_REVOKE_CURRENT_SESSION_MESSAGE;
  }

  return 'Validation failed';
}

export async function DELETE(request: NextRequest, context: SessionRouteContext) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const { sessionId } = await context.params;
    const result = await revokeSessionCommand(sessionId, session.user.id, session.session.id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = errorMessage(status);

      if (status === StatusCodes.UNPROCESSABLE_ENTITY) {
        return NextResponse.json({ message }, { status });
      }

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    recordOwnSessionsRevoked(session, request, 'single');

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
        {
          entityId: sessionId,
          entityLabel: session.user.email,
          metadata: { sessionIds: [sessionId] },
        }
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
