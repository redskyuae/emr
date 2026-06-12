import { StatusCodes } from 'http-status-codes';
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
  if (status === StatusCodes.FORBIDDEN) {
    return 'Forbidden';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
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
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await createTenantCommand(payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: mutationMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<SaveTenantResponse>(
      { data: result.data },
      { status: StatusCodes.CREATED }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
