import { type NextRequest, NextResponse } from 'next/server';

import { reactivateStaffCommand } from '@/app/api/lib/modules/staff/commands/reactivate-staff-command';
import type { Staff } from '@/app/api/lib/modules/staff/schemas/staff-schema';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type StaffRouteContext = {
  params: Promise<{ id: string }>;
};

export type StaffResponse = {
  data: Staff;
};

function errorMessage(status: number) {
  if (status === 404) {
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
    const result = await reactivateStaffCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<StaffResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
