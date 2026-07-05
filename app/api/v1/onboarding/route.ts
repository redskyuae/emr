import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';
import type { OnboardTenantResponse } from './types';

import { onboardTenantCommand } from '@/app/api/lib/modules/tenant-provisioning/commands/onboard-tenant-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Tenant not found';
  }

  return 'Validation failed';
}

export async function POST() {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const result = await onboardTenantCommand(tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status });
      }

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<OnboardTenantResponse>({ data: { tenant: result.data } });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
