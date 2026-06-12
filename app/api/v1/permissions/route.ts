import { type NextRequest, NextResponse } from 'next/server';

import { getPermissionsQuery } from '@/app/api/lib/modules/permission/queries/get-permissions-query';
import type { GroupedPermissions } from '@/app/api/lib/modules/permission/schemas/permission-schema';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

export type PermissionListResponse = {
  data: GroupedPermissions;
};

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
        { status: result.status ?? 400 }
      );
    }

    return NextResponse.json<PermissionListResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
