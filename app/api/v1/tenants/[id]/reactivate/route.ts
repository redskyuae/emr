import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ReactivateTenantResponse } from './types';

import { recordTenantChanged } from '@/app/api/lib/analytics/access-tenant-event';
import { reactivateTenantCommand } from '@/app/api/lib/modules/tenant/commands/reactivate-tenant-command';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';

type TenantRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Tenant not found';
  }

  if (status === StatusCodes.FORBIDDEN) {
    return 'Forbidden';
  }

  return 'Validation failed';
}

export async function PATCH(request: NextRequest, context: TenantRouteContext) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    const result = await reactivateTenantCommand(id, session.user.id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    recordTenantChanged(session, request, result.data, 'tenant_reactivated');

    return NextResponse.json<ReactivateTenantResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
