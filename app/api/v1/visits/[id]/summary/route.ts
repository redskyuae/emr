import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GetVisitSummaryResponse } from './types';

import { getVisitSummaryQuery } from '@/app/api/lib/modules/visit/queries/get-visit-summary-query';
import { requireTenantPermissions, requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

type VisitSummaryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: VisitSummaryRouteContext) {
  try {
    const tenantSession = await requireTenantSession();
    if (tenantSession instanceof Response) return tenantSession;

    const denied = await requireTenantPermissions(tenantSession, ['visit:read']);
    if (denied) return denied;

    // Billing is left out on the server, not just hidden, without Invoice access.
    const billingDenied = await requireTenantPermissions(tenantSession, ['invoice:read']);
    const { id } = await context.params;
    const result = await getVisitSummaryQuery(id, tenantSession.tenantId, {
      includeBilling: billingDenied === null,
      generatedBy: tenantSession.session.user.name ?? null,
    });

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        {
          message: status === StatusCodes.NOT_FOUND ? 'Visit not found' : 'Validation failed',
          errors: result.errors,
        },
        { status }
      );
    }

    return NextResponse.json<GetVisitSummaryResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
