import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ReactivatePatientResponse } from './types';

import { reactivatePatientCommand } from '@/app/api/lib/modules/patient/commands/reactivate-patient-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type PatientRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Patient not found';
  }

  return 'Validation failed';
}

export async function PATCH(_request: NextRequest, context: PatientRouteContext) {
  try {
    // Any authenticated Tenant member may reactivate a Patient — see the note on
    // POST in ../../route.ts for why this isn't requireTenantAdminSession.
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await reactivatePatientCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<ReactivatePatientResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
