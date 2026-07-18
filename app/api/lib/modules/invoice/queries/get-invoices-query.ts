import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { InvoiceListItem } from '../schemas/invoice-schema';
import { validateGetInvoices } from '../validator/get-invoices-validator';

export type GetInvoicesParams = {
  page?: number;
  limit?: number;
  query?: string;
  tenantId: unknown;
  status?: unknown;
  patientId?: number;
};

export async function getInvoicesQuery({
  tenantId,
  status,
  patientId,
  page,
  limit,
  query,
}: GetInvoicesParams): Promise<ListQueryResult<InvoiceListItem>> {
  const validationResult = validateGetInvoices(tenantId, status);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { data, total } = await invoiceRepository.getInvoices({
    tenantId: validationResult.data.tenantId,
    statuses: validationResult.data.statuses,
    patientId,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
