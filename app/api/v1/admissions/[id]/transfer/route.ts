import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { TransferBedResponse } from './types';

import { transferBedCommand } from '@/app/api/lib/modules/admission/commands/transfer-bed-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import {
  analyticsActorFromSession,
  recordServerEventAfterLookup,
} from '@/app/api/lib/analytics/server-analytics';
import { getBedByIdQuery } from '@/app/api/lib/modules/bed/queries/get-bed-by-id-query';

type AdmissionRouteContext = {
  params: Promise<{ id: string }>;
};

function errorMessage(status: number, errors: string[]) {
  if (status === StatusCodes.NOT_FOUND) {
    return 'Admission not found';
  }

  if (status === StatusCodes.CONFLICT && errors.length === 1) {
    return errors[0];
  }

  return status === StatusCodes.CONFLICT ? 'Conflict' : 'Validation failed';
}

export async function POST(request: NextRequest, context: AdmissionRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { message: 'Request body must be valid JSON' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const result = await transferBedCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    // The Ward of the Bed left is read after the response, so an analytics read can never fail or
    // slow the transfer. If it cannot be read, nothing is recorded.
    const { data: admission, fromBedId } = result;

    recordServerEventAfterLookup(
      analyticsActorFromSession(tenantSession, request),
      'bed_transferred',
      async () => {
        const fromBed = await getBedByIdQuery(fromBedId, tenantSession.tenantId);

        return fromBed.success ? { same_ward: fromBed.data.wardId === admission.ward.id } : null;
      }
    );

    return NextResponse.json<TransferBedResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
