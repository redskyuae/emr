import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getUserAuditListQuery } from '@/app/api/lib/modules/audit-log/queries/get-user-audit-list-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { ListUserAuditResponse } from './types';

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, ['audit-log:read']);

    if (permissionResponse) {
      return permissionResponse;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInteger(searchParams.get('page'), 1);
    const limit = Math.min(100, parsePositiveInteger(searchParams.get('limit'), 25));
    const filters = Object.fromEntries(
      (['fromDate', 'toDate', 'query'] as const).flatMap((name) => {
        const value = searchParams.get(name)?.trim();
        return value ? [[name, value]] : [];
      })
    );

    const result = await getUserAuditListQuery({ ...filters, page, limit }, tenantSession.tenantId);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<ListUserAuditResponse>({
      data: result.data,
      meta: {
        total: result.total,
        pageSize: limit,
        pageNumber: page,
        totalPages: result.total > 0 ? Math.ceil(result.total / limit) : 0,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
