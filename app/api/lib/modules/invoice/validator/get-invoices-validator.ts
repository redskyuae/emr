import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  invoiceStatusFilterSchema,
  invoiceTenantIdSchema,
  type InvoiceStatus,
} from '../schemas/invoice-schema';

export type GetInvoicesFilters = {
  tenantId: string;
  statuses?: InvoiceStatus[];
};

// Accepts a single status or a comma-separated set (e.g. the "Open" default:
// DRAFT,FINALIZED,PARTIALLY_PAID). An unknown value is rejected, not ignored.
export function validateGetInvoices(
  tenantId: unknown,
  status: unknown
): ValidationResult<GetInvoicesFilters> {
  const tenantIdResult = invoiceTenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  if (status === undefined || status === null || status === '') {
    return { success: true, data: { tenantId: tenantIdResult.data } };
  }

  const rawValues = String(status)
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value !== '');
  const statuses: InvoiceStatus[] = [];

  for (const value of rawValues) {
    const parsed = invoiceStatusFilterSchema.safeParse(value);

    if (!parsed.success || parsed.data === undefined) {
      return { success: false, errors: [`Invoice status ${value} is Invalid.`] };
    }

    statuses.push(parsed.data);
  }

  return {
    success: true,
    data: { tenantId: tenantIdResult.data, statuses: statuses.length > 0 ? statuses : undefined },
  };
}
