import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { DeactivateTenantResponse } from './types';

import { deactivateTenantCommand } from '@/app/api/lib/modules/tenant/commands/deactivate-tenant-command';
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

export async function PATCH(_request: NextRequest, context: TenantRouteContext) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    const result = await deactivateTenantCommand(id, session.user.id);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<DeactivateTenantResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
