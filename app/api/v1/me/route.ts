import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';
import type { MeResponse } from './types';

import { getCurrentUserQuery } from '@/app/api/lib/modules/current-user/queries/get-current-user-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

function errorMessage(status: number, errors: string[]) {
  if (errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.FORBIDDEN ? 'Forbidden' : 'Request failed';
}

export async function GET() {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const result = await getCurrentUserQuery(tenantSession.session.user.id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<MeResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
