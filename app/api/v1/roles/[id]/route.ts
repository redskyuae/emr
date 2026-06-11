import { type NextRequest, NextResponse } from 'next/server';

import { deleteRoleCommand } from '@/app/api/lib/modules/role/commands/delete-role-command';
import { updateRoleCommand } from '@/app/api/lib/modules/role/commands/update-role-command';
import { getRoleByIdQuery } from '@/app/api/lib/modules/role/queries/get-role-by-id-query';
import type { Role } from '@/app/api/lib/modules/role/schemas/role-schema';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type RoleRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateRoleRequest = {
  name?: string;
  description?: string | null;
};

export type RoleResponse = {
  data: Role;
};

function errorMessage(status: number, errors: string[]) {
  if (status === 404) {
    return 'Role not found';
  }

  if ((status === 409 || status === 422) && errors.length === 1) {
    return errors[0];
  }

  if (status === 409) {
    return 'Conflict';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: RoleRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getRoleByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<RoleResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RoleRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateRoleCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<RoleResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RoleRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await deleteRoleCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? 400;

      if (status === 422) {
        return NextResponse.json({ message: errorMessage(status, result.errors) }, { status });
      }

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
