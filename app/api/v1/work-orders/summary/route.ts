import { StatusCodes } from 'http-status-codes';
import { NextResponse } from 'next/server';
import type { GetWorkOrderSummaryResponse } from './types';

import { getWorkOrderSummaryQuery } from '@/app/api/lib/modules/work-order/queries/get-work-order-summary-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';

export async function GET() {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const result = await getWorkOrderSummaryQuery(tenantSession.tenantId);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.errors },
        { status: result.status ?? StatusCodes.BAD_REQUEST }
      );
    }

    return NextResponse.json<GetWorkOrderSummaryResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
