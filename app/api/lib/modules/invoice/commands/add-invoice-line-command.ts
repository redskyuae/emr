import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateAddInvoiceLine } from '../validator/add-invoice-line-validator';

export async function addInvoiceLineCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Invoice>> {
  const validationResult = await validateAddInvoiceLine(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const { invoiceId, ...line } = validationResult.data;
  const result = await invoiceRepository.addInvoiceLine(tenantId, invoiceId, line);

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Invoice not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'not-draft') {
    return {
      success: false,
      errors: [`Invoice ${result.data.invoiceNumber} can only be edited while in Draft.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: result.data };
}
