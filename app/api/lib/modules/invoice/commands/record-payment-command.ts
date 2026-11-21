import { StatusCodes } from 'http-status-codes';

import type { CommandResultWith } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { visitRepository } from '../../visit/repository/visit-repository';
import { invoiceRepository } from '../repository/invoice-repository';
import { roundMoney, type Invoice, type Payment } from '../schemas/invoice-schema';
import { validateRecordPayment } from '../validator/record-payment-validator';

export type RecordPaymentCommandData = {
  invoice: Invoice;
  payment: Payment;
};

export async function recordPaymentCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
  // `visitCheckedInAt` is internal only (analytics); the response returns `data` alone.
): Promise<CommandResultWith<RecordPaymentCommandData, { visitCheckedInAt: Date | null }>> {
  const validationResult = await validateRecordPayment(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const { invoiceId, payload: data } = validationResult.data;

  let result;

  try {
    result = await invoiceRepository.recordPayment(tenantId, invoiceId, data);
  } catch (error) {
    const dbError = getDatabaseError(error);

    // The atomic counter increment makes this collision practically
    // unreachable in normal operation, but the unique index is the documented
    // backstop (ADR 0036/0039) — map it to a clean conflict, not a 500.
    if (dbError?.code === '23505' && dbError.constraint === 'payment_tenant_receipt_idx') {
      return {
        success: false,
        errors: ['Receipt Number allocation conflicted. Please retry.'],
        status: StatusCodes.CONFLICT,
      };
    }

    throw error;
  }

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Invoice not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'not-payable') {
    return {
      success: false,
      errors: [`Invoice ${result.data.invoiceNumber} is not open for payment.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (result.outcome === 'over-balance') {
    const balanceDue = roundMoney(result.data.grandTotal - result.data.amountPaid);
    return {
      success: false,
      errors: [
        `Payment amount ${data.amount} exceeds the balance due ${balanceDue} on invoice ${result.data.invoiceNumber}.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  // The Payment is already recorded, so a failed read here must not fail the request.
  const visit = result.data.visit
    ? await visitRepository.getVisitById(result.data.visit.id, tenantId).catch(() => undefined)
    : undefined;

  return {
    success: true,
    data: { invoice: result.data, payment: result.payment },
    visitCheckedInAt: visit?.checkedInAt ?? null,
  };
}
