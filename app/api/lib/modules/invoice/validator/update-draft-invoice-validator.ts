import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { invoiceRepository } from '../repository/invoice-repository';
import {
  invoiceIdSchema,
  updateDraftInvoiceSchema,
  type UpdateDraftInvoiceInput,
} from '../schemas/invoice-schema';

export type ValidatedUpdateDraftInvoice = {
  invoiceId: number;
  payload: UpdateDraftInvoiceInput;
};

export async function validateUpdateDraftInvoice(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<ValidatedUpdateDraftInvoice>> {
  const idResult = invoiceIdSchema.safeParse(id);
  const payloadResult = updateDraftInvoiceSchema.safeParse(payload);

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

  if (invoice.status !== 'DRAFT') {
    return {
      success: false,
      errors: [`Invoice ${invoice.invoiceNumber} can only be edited while in Draft.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (payloadResult.data.discountAmount > invoice.subtotal) {
    return {
      success: false,
      errors: [
        `Discount ${payloadResult.data.discountAmount} exceeds the invoice subtotal ${invoice.subtotal}.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { invoiceId: idResult.data, payload: payloadResult.data } };
}
