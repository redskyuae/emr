import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { invoiceRepository } from '../repository/invoice-repository';
import {
  invoiceIdSchema,
  recordPaymentSchema,
  roundMoney,
  type RecordPaymentInput,
} from '../schemas/invoice-schema';

export type ValidatedRecordPayment = {
  invoiceId: number;
  payload: RecordPaymentInput;
};

export async function validateRecordPayment(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<ValidatedRecordPayment>> {
  const idResult = invoiceIdSchema.safeParse(id);
  const payloadResult = recordPaymentSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Invoice ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const invoice = await invoiceRepository.findInvoiceById(tenantId, idResult.data);

  if (!invoice) {
    return { success: false, errors: [`Invoice ${id} is Invalid.`], status: StatusCodes.NOT_FOUND };
  }

  if (invoice.status !== 'FINALIZED' && invoice.status !== 'PARTIALLY_PAID') {
    return {
      success: false,
      errors: [`Invoice ${invoice.invoiceNumber} is not open for payment.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const balanceDue = roundMoney(invoice.grandTotal - invoice.amountPaid);

  if (payloadResult.data.amount > balanceDue) {
    return {
      success: false,
      errors: [
        `Payment amount ${payloadResult.data.amount} exceeds the balance due ${balanceDue} on invoice ${invoice.invoiceNumber}.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { invoiceId: idResult.data, payload: payloadResult.data } };
}
