import { type NextRequest, NextResponse } from 'next/server';

import { createRoleCommand } from '@/app/api/lib/modules/role/commands/create-role-command';
import { getRolesQuery } from '@/app/api/lib/modules/role/queries/get-roles-query';
import type { Role } from '@/app/api/lib/modules/role/schemas/role-schema';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { parsePositiveInteger } from '@/app/api/lib/utils/parser';
import type { Paginated } from '@/app/api/lib/utils/types';

export type SaveRoleRequest = {
  name: string;
  code: string;
  description?: string;
};

export type SaveRoleResponse = {
  data: Role;
};

function mutationMessage(status: number, errors: string[]) {
  if (status === 409 && errors.length === 1) {
    return errors[0];
  }

  return status === 409 ? 'Conflict' : 'Validation failed';
}

export async function GET(request: NextRequest) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const page = parsePositiveInteger(request.nextUrl.searchParams.get('page'), 1);
    const limit = parsePositiveInteger(request.nextUrl.searchParams.get('limit'), 10);
    const query =
      request.nextUrl.searchParams.get('query')?.trim() ||
      request.nextUrl.searchParams.get('search')?.trim() ||
      undefined;
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(999, Math.max(1, Math.floor(limit)));

    const queryResult = await getRolesQuery({
      tenantId: tenantSession.tenantId,
      page: safePage,
      limit: safeLimit,
      query,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: queryResult.errors },
        { status: queryResult.status ?? 400 }
      );
    }

    const totalPages = queryResult.total > 0 ? Math.ceil(queryResult.total / safeLimit) : 0;

    return NextResponse.json<Paginated<Role>>({
      data: queryResult.data,
      meta: {
        total: queryResult.total,
        totalPages,
        pageSize: safeLimit,
        pageNumber: safePage,
      },
    });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await createRoleCommand(payload, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveRoleResponse>({ data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
