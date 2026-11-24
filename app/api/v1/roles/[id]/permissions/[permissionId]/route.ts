import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { recordRolePermissionRemoved } from '@/app/api/lib/analytics/access-assignment-event';
import { removePermissionCommand } from '@/app/api/lib/modules/role-permission/commands/remove-permission-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { getRoleByIdQuery } from '@/app/api/lib/modules/role/queries/get-role-by-id-query';
import { getPermissionByIdQuery } from '@/app/api/lib/modules/permission/queries/get-permission-by-id-query';

type RolePermissionRouteContext = {
  params: Promise<{ id: string; permissionId: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND && errors.includes('Role not found')) {
    return 'Role not found';
  }

  if (status === StatusCodes.NOT_FOUND && errors.includes('Permission Assignment not found')) {
    return 'Permission Assignment not found';
  }

  return 'Validation failed';
}

export async function DELETE(request: NextRequest, context: RolePermissionRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id: roleId, permissionId } = await context.params;
    const result = await removePermissionCommand(roleId, permissionId, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordRolePermissionRemoved(tenantSession, request, result.data.roleId);

    // Recorded by name, like the grant/revoke lists of the bulk permission routes.
    await recordAuditEvent(tenantSession, request, 'role.permissions-change', async () => {
      const [role, permission] = await Promise.all([
        getRoleByIdQuery(result.data.roleId, tenantSession.tenantId),
        getPermissionByIdQuery(result.data.permissionId),
      ]);

      return {
        entityId: result.data.roleId,
        entityLabel: role.success ? role.data.name : null,
        metadata: {
          granted: [],
          revoked: [permission.success ? permission.data.name : String(result.data.permissionId)],
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
