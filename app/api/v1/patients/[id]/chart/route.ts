import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetPatientChartResponse } from './types';

import { getPatientChartQuery } from '@/app/api/lib/modules/patient-chart/queries/get-patient-chart-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type PatientChartRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: PatientChartRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getPatientChartQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = status === StatusCodes.NOT_FOUND ? 'Patient not found' : 'Validation failed';

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return NextResponse.json<GetPatientChartResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
