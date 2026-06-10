import { type NextRequest, NextResponse } from 'next/server';

import { reactivateTenantCommand } from '@/app/api/lib/modules/tenant/commands/reactivate-tenant-command';
import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';

type TenantRouteContext = {
  params: Promise<{ id: string }>;
};

export type TenantResponse = {
  data: Tenant;
};

function errorMessage(status: number) {
  if (status === 404) {
    return 'Tenant not found';
  }

  if (status === 403) {
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
    const result = await reactivateTenantCommand(id, session.user.id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<TenantResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
