import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { invoiceRepository } from '../repository/invoice-repository';
import { invoiceIdSchema, voidInvoiceSchema } from '../schemas/invoice-schema';

export type ValidatedVoidInvoice = {
  id: number;
  voidReason: string;
};

export async function validateVoidInvoice(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<ValidatedVoidInvoice>> {
  const idResult = invoiceIdSchema.safeParse(id);
  const payloadResult = voidInvoiceSchema.safeParse(payload);

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

  const voidable =
    (invoice.status === 'DRAFT' || invoice.status === 'FINALIZED') && invoice.amountPaid === 0;

  if (!voidable) {
    return {
      success: false,
      errors: [`Invoice ${invoice.invoiceNumber} cannot be voided after payments are recorded.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { id: idResult.data, voidReason: payloadResult.data.voidReason } };
}
