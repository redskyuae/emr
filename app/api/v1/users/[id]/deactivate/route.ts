import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { DeactivateStaffResponse } from './types';

import { deactivateStaffCommand } from '@/app/api/lib/modules/staff/commands/deactivate-staff-command';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type StaffRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Staff not found';
  }

  return 'Validation failed';
}

export async function PATCH(_request: NextRequest, context: StaffRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await deactivateStaffCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<DeactivateStaffResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
