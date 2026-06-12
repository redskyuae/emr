import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getPermissionByIdQuery } from '@/app/api/lib/modules/permission/queries/get-permission-by-id-query';
import type { Permission } from '@/app/api/lib/modules/permission/schemas/permission-schema';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type PermissionRouteContext = {
  params: Promise<{ id: string }>;
};

export type PermissionResponse = {
  data: Permission;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Permission not found';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: PermissionRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getPermissionByIdQuery(id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<PermissionResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
