import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { invoiceRepository } from '../repository/invoice-repository';
import { invoiceIdSchema, invoiceTenantIdSchema } from '../schemas/invoice-schema';

export type DeleteInvoiceInput = {
  id: number;
  tenantId: string;
};

export async function validateDeleteInvoice(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<DeleteInvoiceInput>> {
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

  const invoice = await invoiceRepository.findInvoiceById(tenantIdResult.data, idResult.data);

  if (!invoice) {
    return { success: false, errors: [`Invoice ${id} is Invalid.`], status: StatusCodes.NOT_FOUND };
  }

  if (invoice.status !== 'DRAFT' && invoice.status !== 'VOID') {
    return {
      success: false,
      errors: [`Invoice ${invoice.invoiceNumber} cannot be removed once finalized.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
