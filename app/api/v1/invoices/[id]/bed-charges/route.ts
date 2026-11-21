import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { GenerateBedChargesResponse } from './types';

import { generateBedChargesCommand } from '@/app/api/lib/modules/invoice/commands/generate-bed-charges-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';

type BedChargesRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (
    (status === StatusCodes.CONFLICT || status === StatusCodes.NOT_FOUND) &&
    errors.length === 1
  ) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function POST(request: NextRequest, context: BedChargesRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await generateBedChargesCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'bed_charges_generated', () => ({
      line_count: result.data.linesAdded,
    }));

    return NextResponse.json<GenerateBedChargesResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
