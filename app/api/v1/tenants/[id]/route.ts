import { type NextRequest, NextResponse } from 'next/server';

import { updateTenantCommand } from '@/app/api/lib/modules/tenant/commands/update-tenant-command';
import { getTenantByIdQuery } from '@/app/api/lib/modules/tenant/queries/get-tenant-by-id-query';
import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';

type TenantRouteContext = {
  params: Promise<{ id: string }>;
};

export type UpdateTenantRequest = {
  name?: string;
  logo?: string;
};

export type TenantResponse = {
  data: Tenant;
};

function errorMessage(status: number, errors: string[]) {
  if (status === 404) {
    return 'Tenant not found';
  }

  if (status === 403) {
    return 'Forbidden';
  }

  if (status === 409 && errors.length === 1) {
    return errors[0];
  }

  return status === 409 ? 'Conflict' : 'Validation failed';
}

export async function GET(_request: NextRequest, context: TenantRouteContext) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    const result = await getTenantByIdQuery(id, session.user.id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<TenantResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: TenantRouteContext) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await updateTenantCommand(id, payload, session.user.id);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<TenantResponse>({ data: result.data });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
