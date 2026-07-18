import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  invoiceIdSchema,
  invoiceLineIdSchema,
  invoiceTenantIdSchema,
} from '../schemas/invoice-schema';

export type RemoveInvoiceLineInput = {
  invoiceId: number;
  lineId: number;
  tenantId: string;
};

export function validateRemoveInvoiceLine(
  id: unknown,
  lineId: unknown,
  tenantId: unknown
): ValidationResult<RemoveInvoiceLineInput> {
  const idResult = invoiceIdSchema.safeParse(id);
  const lineIdResult = invoiceLineIdSchema.safeParse(lineId);
  const tenantIdResult = invoiceTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !lineIdResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Invoice ${String(id)} is Invalid.`);
    }

    if (!lineIdResult.success) {
      errors.push(`Invoice line ${String(lineId)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { invoiceId: idResult.data, lineId: lineIdResult.data, tenantId: tenantIdResult.data },
  };
}
