import { type NextRequest, NextResponse } from 'next/server';

import { createTenantCommand } from '@/app/api/lib/modules/tenant/commands/create-tenant-command';
import type { Tenant } from '@/app/api/lib/modules/tenant/schemas/tenant-schema';
import { requireAuth } from '@/app/api/lib/utils/auth-helpers';

export type SaveTenantRequest = {
  name: string;
  logo?: string;
};

export type SaveTenantResponse = {
  data: Tenant;
};

function mutationMessage(status: number, errors: string[]) {
  if (status === 403) {
    return 'Forbidden';
  }

  if (status === 409 && errors.length === 1) {
    return errors[0];
  }

  return status === 409 ? 'Conflict' : 'Validation failed';
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session instanceof Response) {
      return session;
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON' }, { status: 400 });
    }

    const result = await createTenantCommand(payload);

    if (!result.success) {
      const status = result.status ?? 400;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveTenantResponse>({ data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
