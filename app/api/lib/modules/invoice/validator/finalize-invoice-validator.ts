import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { invoiceRepository } from '../repository/invoice-repository';
import { invoiceIdSchema, invoiceTenantIdSchema } from '../schemas/invoice-schema';

export type FinalizeInvoiceInput = {
  id: number;
  tenantId: string;
};

export async function validateFinalizeInvoice(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<FinalizeInvoiceInput>> {
  const idResult = invoiceIdSchema.safeParse(id);
  const tenantIdResult = invoiceTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Invoice ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  const invoice = await invoiceRepository.getInvoiceById(tenantIdResult.data, idResult.data);

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

  if (invoice.lines.length === 0) {
    return {
      success: false,
      errors: [`Invoice ${invoice.invoiceNumber} has no lines to finalize.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
