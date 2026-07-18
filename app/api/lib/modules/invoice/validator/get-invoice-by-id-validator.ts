import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { invoiceIdSchema, invoiceTenantIdSchema } from '../schemas/invoice-schema';

export type GetInvoiceByIdInput = {
  id: number;
  tenantId: string;
};

export function validateGetInvoiceById(
  id: unknown,
  tenantId: unknown
): ValidationResult<GetInvoiceByIdInput> {
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

  return { success: true, data: { id: idResult.data, tenantId: tenantIdResult.data } };
}
