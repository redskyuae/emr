import { type NextRequest, NextResponse } from 'next/server';

import { updateStaffCommand } from '@/app/api/lib/modules/staff/commands/update-staff-command';
import { getStaffByIdQuery } from '@/app/api/lib/modules/staff/queries/get-staff-by-id-query';
import type { Staff } from '@/app/api/lib/modules/staff/schemas/staff-schema';
import { requireTenantAdminSession } from '@/app/api/lib/utils/auth-helpers';

type StaffRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateStaffRequest = {
  name?: string;
  phone?: string | null;
  staffCode?: string | null;
  designation?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | null;
  dateOfBirth?: string | null;
};

export type StaffResponse = {
  data: Staff;
};

function errorMessage(status: number, errors: string[]) {
  if (status === 404) {
    return 'Staff not found';
  }

  if (status === 409 && errors.length === 1) {
    return errors[0];
  }

  return status === 409 ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: StaffRouteContext) {
  try {
    const tenantSession = await requireTenantAdminSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getStaffByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<StaffResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: StaffRouteContext) {
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

    const result = await updateStaffCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<StaffResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
