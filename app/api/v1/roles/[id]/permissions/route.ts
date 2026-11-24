import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type {
  AssignRolePermissionsResponse,
  GetRolePermissionsResponse,
  SetRolePermissionsResponse,
} from './types';

import {
  analyticsActorFromSession,
  recordServerEvent,
} from '@/app/api/lib/analytics/server-analytics';
import { assignPermissionsCommand } from '@/app/api/lib/modules/role-permission/commands/assign-permissions-command';
import { setPermissionsCommand } from '@/app/api/lib/modules/role-permission/commands/set-permissions-command';
import { getRolePermissionsQuery } from '@/app/api/lib/modules/role-permission/queries/get-role-permissions-query';
import { requireTenantAdminSession, type TenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getRoleByIdQuery } from '@/app/api/lib/modules/role/queries/get-role-by-id-query';
import type { AssignedPermission } from '@/app/api/lib/modules/role-permission/schemas/role-permission-schema';

// Both writes return the Role's full permission set, so the grant/revoke lists are
// the difference between the set read before the write and the set after it.
async function recordPermissionsChange(
  tenantSession: TenantSession,
  request: NextRequest,
  roleId: string,
  before: AssignedPermission[] | null,
  after: AssignedPermission[]
) {
  const beforeNames = new Set((before ?? []).map(({ name }) => name));
  const afterNames = new Set(after.map(({ name }) => name));

  await recordAuditEvent(tenantSession, request, 'role.permissions-change', async () => {
    const role = await getRoleByIdQuery(roleId, tenantSession.tenantId);

    return {
      entityId: roleId,
      entityLabel: role.success ? role.data.name : null,
      metadata: {
        granted: [...afterNames].filter((name) => !beforeNames.has(name)),
        revoked: before ? [...beforeNames].filter((name) => !afterNames.has(name)) : [],
        permissionCount: after.length,
      },
    };
  });
}

type RolePermissionsRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND && errors.includes('Role not found')) {
    return 'Role not found';
  }

  return 'Validation failed';
}

export async function GET(_request: NextRequest, context: RolePermissionsRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: roleId } = await context.params;
    const result = await getRolePermissionsQuery(roleId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<GetRolePermissionsResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest, context: RolePermissionsRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: roleId } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const before = await getRolePermissionsQuery(roleId, tenantSession.tenantId);
    const result = await assignPermissionsCommand(roleId, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(
      analyticsActorFromSession(tenantSession, request),
      'role_permissions_changed',
      { permission_count: result.data.length }
    );

    await recordPermissionsChange(
      tenantSession,
      request,
      roleId,
      before.success ? before.data : null,
      result.data
    );

    return NextResponse.json<AssignRolePermissionsResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(request: NextRequest, context: RolePermissionsRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: roleId } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const before = await getRolePermissionsQuery(roleId, tenantSession.tenantId);
    const result = await setPermissionsCommand(roleId, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordServerEvent(
      analyticsActorFromSession(tenantSession, request),
      'role_permissions_changed',
      { permission_count: result.data.length }
    );

    await recordPermissionsChange(
      tenantSession,
      request,
      roleId,
      before.success ? before.data : null,
      result.data
    );

    return NextResponse.json<SetRolePermissionsResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
