import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
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
): Promise<CommandResult<RecordPaymentCommandData>> {
  const validationResult = await validateRecordPayment(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const { invoiceId, payload: data } = validationResult.data;
  const result = await invoiceRepository.recordPayment(tenantId, invoiceId, data);

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

  return { success: true, data: { invoice: result.data, payment: result.payment } };
}
