import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListPermissionsResponse } from './types';

import { getPermissionsQuery } from '@/app/api/lib/modules/permission/queries/get-permissions-query';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const moduleFilter = request.nextUrl.searchParams.get('module')?.trim() || undefined;
    const result = await getPermissionsQuery({ module: moduleFilter });

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<ListPermissionsResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
