import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateRemoveInvoiceLine } from '../validator/remove-invoice-line-validator';

export async function removeInvoiceLineCommand(
  id: unknown,
  lineId: unknown,
  tenantId: unknown
): Promise<CommandResult<Invoice>> {
  const validationResult = validateRemoveInvoiceLine(id, lineId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const { invoiceId, lineId: validLineId, tenantId: validTenantId } = validationResult.data;
  const result = await invoiceRepository.removeInvoiceLine(validTenantId, invoiceId, validLineId);

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

  if (result.outcome === 'line-not-found') {
    return { success: false, errors: ['Invoice line not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'amount-too-large') {
    return {
      success: false,
      errors: ['Invoice total would exceed the maximum allowed amount.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: result.data };
}
