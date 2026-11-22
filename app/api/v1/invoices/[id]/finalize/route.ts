import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { FinalizeInvoiceResponse } from './types';

import { finalizeInvoiceCommand } from '@/app/api/lib/modules/invoice/commands/finalize-invoice-command';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import { recordLifecycleEvent } from '@/app/api/lib/analytics/lifecycle-event-recorder';
import { invoiceFinalizedProperties } from '@/app/api/lib/analytics/lifecycle-billing-properties';

type FinalizeRouteContext = {
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

export async function POST(request: NextRequest, context: FinalizeRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await finalizeInvoiceCommand(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    recordLifecycleEvent(tenantSession, request, 'invoice_finalized', () =>
      invoiceFinalizedProperties(result.data)
    );

    await recordAuditEvent(tenantSession, request, 'invoice.finalize', {
      entityId: result.data.id,
      visitId: result.data.visit?.id ?? null,
      patientId: result.data.patient.id,
      entityLabel: result.data.invoiceNumber,
    });

    return NextResponse.json<FinalizeInvoiceResponse>({ data: result.data });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
