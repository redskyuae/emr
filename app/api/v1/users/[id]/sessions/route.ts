import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListUserSessionsResponse } from './types';

import { revokeUserSessionsCommand } from '@/app/api/lib/modules/session/commands/revoke-user-sessions-command';
import { getUserSessionsQuery } from '@/app/api/lib/modules/session/queries/get-user-sessions-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

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

export async function DELETE(_request: NextRequest, context: UserSessionsRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: userId } = await context.params;
    const result = await revokeUserSessionsCommand(userId, tenantSession.tenantId);

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
