import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateGetInvoiceById } from '../validator/get-invoice-by-id-validator';

export async function getInvoiceByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Invoice>> {
  const validationResult = validateGetInvoiceById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const invoice = await invoiceRepository.getInvoiceById(
    validationResult.data.tenantId,
    validationResult.data.id
  );

  if (!invoice) {
    return { success: false, errors: ['Invoice not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: invoice };
}
