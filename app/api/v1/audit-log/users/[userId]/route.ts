import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getUserAuditDetailQuery } from '@/app/api/lib/modules/audit-log/queries/get-user-audit-detail-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { GetUserAuditResponse } from './types';

type UserAuditRouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: NextRequest, context: UserAuditRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, ['audit-log:read']);

    if (permissionResponse) {
      return permissionResponse;
    }

    const { userId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(
      (['fromDate', 'toDate'] as const).flatMap((name) => {
        const value = searchParams.get(name)?.trim();
        return value ? [[name, value]] : [];
      })
    );

    const result = await getUserAuditDetailQuery(userId, filters, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message: status === StatusCodes.NOT_FOUND ? 'User not found' : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    return NextResponse.json<GetUserAuditResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
