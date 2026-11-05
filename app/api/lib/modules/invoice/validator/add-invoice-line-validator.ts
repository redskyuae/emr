import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { chargeItemRepository } from '@/app/api/lib/modules/charge-item/repository/charge-item-repository';
import { invoiceRepository } from '../repository/invoice-repository';
import {
  addInvoiceLineSchema,
  invoiceIdSchema,
  MAX_MONEY_AMOUNT,
  roundMoney,
} from '../schemas/invoice-schema';

export type ValidatedAddInvoiceLine = {
  invoiceId: number;
  chargeItemId: number;
  description: string;
  quantity: number;
  unitPrice: number;
};

export async function validateAddInvoiceLine(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<ValidatedAddInvoiceLine>> {
  const idResult = invoiceIdSchema.safeParse(id);
  const payloadResult = addInvoiceLineSchema.safeParse(payload);

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

  const chargeItem = await chargeItemRepository.getChargeItemById(
    payloadResult.data.chargeItemId,
    tenantId
  );

  if (!chargeItem) {
    return {
      success: false,
      errors: [`Charge item ${payloadResult.data.chargeItemId} is Invalid.`],
      status: StatusCodes.NOT_FOUND,
    };
  }

  if (!chargeItem.isActive) {
    return {
      success: false,
      errors: [`Charge item ${chargeItem.code} is inactive.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (
    chargeItem.effectiveDate &&
    chargeItem.effectiveDate > new Date().toISOString().slice(0, 10)
  ) {
    return {
      success: false,
      errors: [`Charge item ${chargeItem.code} is not effective yet.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const quantity = payloadResult.data.quantity;
  const unitPrice = payloadResult.data.unitPrice ?? chargeItem.cashPrice ?? chargeItem.unitPrice;
  const amount = roundMoney(quantity * unitPrice);

  if (amount > MAX_MONEY_AMOUNT) {
    return {
      success: false,
      errors: [`Line amount ${amount} exceeds the maximum allowed amount ${MAX_MONEY_AMOUNT}.`],
      status: StatusCodes.BAD_REQUEST,
    };
  }

  return {
    success: true,
    data: {
      invoiceId: idResult.data,
      chargeItemId: chargeItem.id,
      description: chargeItem.name,
      quantity,
      unitPrice,
    },
  };
}
