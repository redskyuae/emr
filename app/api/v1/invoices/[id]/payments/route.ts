import { StatusCodes } from 'http-status-codes';
import { type NextRequest, NextResponse } from 'next/server';
import type { ListPaymentsResponse, RecordPaymentResponse } from './types';

import { recordPaymentCommand } from '@/app/api/lib/modules/invoice/commands/record-payment-command';
import { getInvoiceByIdQuery } from '@/app/api/lib/modules/invoice/queries/get-invoice-by-id-query';
import { requireTenantSession } from '@/app/api/lib/utils/auth-helpers';
import { recordAuditEvent } from '@/app/api/lib/audit/audit-recorder';
import {
  analyticsActorFromSession,
  recordServerEventAfterLookup,
} from '@/app/api/lib/analytics/server-analytics';
import { getVisitByIdQuery } from '@/app/api/lib/modules/visit/queries/get-visit-by-id-query';
import { paymentRecordedProperties } from '@/app/api/lib/analytics/lifecycle-billing-properties';

type PaymentsRouteContext = {
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

export async function GET(_request: NextRequest, context: PaymentsRouteContext) {
  try {
    const tenantSession = await requireTenantSession();

    if (tenantSession instanceof Response) {
      return tenantSession;
    }

    const { id } = await context.params;
    const result = await getInvoiceByIdQuery(id, tenantSession.tenantId);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    return NextResponse.json<ListPaymentsResponse>({ data: result.data.payments });
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest, context: PaymentsRouteContext) {
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

    const result = await recordPaymentCommand(id, tenantSession.tenantId, payload);

    if (!result.success) {
      const status = result.status ?? StatusCodes.BAD_REQUEST;

      return NextResponse.json(
        { message: errorMessage(status, result.errors), errors: result.errors },
        { status }
      );
    }

    // The linked Visit's check-in time is read after the response: the Payment is already
    // committed, and an analytics read must never delay this request into a client retry.
    const { invoice, payment } = result.data;

    recordServerEventAfterLookup(
      analyticsActorFromSession(tenantSession, request),
      'payment_recorded',
      async () => {
        const visit = invoice.visit
          ? await getVisitByIdQuery(invoice.visit.id, tenantSession.tenantId)
          : null;

        return paymentRecordedProperties(
          invoice,
          payment,
          visit?.success ? visit.data.checkedInAt : null
        );
      }
    );

    await recordAuditEvent(tenantSession, request, 'payment.record', {
      entityId: payment.id,
      visitId: invoice.visit?.id ?? null,
      patientId: invoice.patient.id,
      entityLabel: payment.receiptNumber,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        method: payment.method,
        amount: payment.amount,
      },
    });

    return NextResponse.json<RecordPaymentResponse>(
      { data: result.data },
      { status: StatusCodes.CREATED }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
