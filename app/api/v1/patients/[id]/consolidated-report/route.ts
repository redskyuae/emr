import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';

import { getConsolidatedPatientReportQuery } from '@/app/api/lib/modules/consolidated-patient-report/queries/get-consolidated-patient-report-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import type { GetConsolidatedPatientReportResponse } from './types';

type ConsolidatedReportRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: ConsolidatedReportRouteContext) {
  try {
    const tenantSession = await requireTenantSession();
    if (tenantSession instanceof Response) return tenantSession;

    const denied = await requireTenantPermissions(tenantSession, ['visit:read']);
    if (denied) return denied;

    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const result = await getConsolidatedPatientReportQuery(
      id,
      tenantSession.tenantId,
      {
        toDate: searchParams.get('toDate') ?? undefined,
        fromDate: searchParams.get('fromDate') ?? undefined,
      },
      { generatedBy: tenantSession.session.user.name ?? null }
    );

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;
      const message = status === StatusCodes.NOT_FOUND ? 'Patient not found' : 'Validation failed';

      return NextResponse.json({ message, errors: result.errors }, { status });
    }

    return NextResponse.json<GetConsolidatedPatientReportResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
