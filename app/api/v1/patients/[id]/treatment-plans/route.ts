import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getPatientTreatmentPlansQuery } from '@/app/api/lib/modules/patient-treatment-plan/queries/get-patient-treatment-plans-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { ListPatientTreatmentPlansResponse } from './types';

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/v1/patients/[id]/treatment-plans'>
) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const permissionResponse = await requireTenantPermissions(tenantSession, [
      'patient-treatment-plan:read',
    ]);

    if (permissionResponse) {
      return permissionResponse;
    }

    const { id } = await context.params;
    const result = await getPatientTreatmentPlansQuery(
      id,
      tenantSession.tenantId,
      request.nextUrl.searchParams.get('status')
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = status === StatusCodes.NOT_FOUND ? 'Patient not found' : 'Validation failed';

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return NextResponse.json<ListPatientTreatmentPlansResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
