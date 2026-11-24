import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListUserSessionsResponse } from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { revokeUserSessionsCommand } from '@/app/api/lib/modules/session/commands/revoke-user-sessions-command';
import { getUserSessionsQuery } from '@/app/api/lib/modules/session/queries/get-user-sessions-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getStaffByIdQuery } from '@/app/api/lib/modules/staff/queries/get-staff-by-id-query';

type UserSessionsRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Staff not found';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: UserSessionsRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: userId } = await context.params;
    const result = await getUserSessionsQuery(
      userId,
      tenantSession.tenantId,
      tenantSession.session.session.id
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<ListUserSessionsResponse>({
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

export async function DELETE(request: NextRequest, context: UserSessionsRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: userId } = await context.params;
    // Read first so the Audit Log can name each Session the revoke ends.
    const ending = await getUserSessionsQuery(
      userId,
      tenantSession.tenantId,
      tenantSession.session.session.id
    );
    const result = await revokeUserSessionsCommand(userId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(analyticsActorFromSession(tenantSession, request), 'sessions_revoked', {
      scope: 'user',
    });

    await recordAuditEvent(tenantSession, request, 'user.sessions-revoke', async () => {
      const staff = await getStaffByIdQuery(userId, tenantSession.tenantId);

      return {
        entityId: userId,
        entityLabel: staff.success ? staff.data.email : null,
        metadata: {
          sessionIds: ending.success && 'total' in ending ? ending.data.map(({ id }) => id) : [],
        },
      };
    });

    return new Response(null, { status: StatusCodes.NO_CONTENT });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
