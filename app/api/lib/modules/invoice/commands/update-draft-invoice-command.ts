import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateUpdateDraftInvoice } from '../validator/update-draft-invoice-validator';

export async function updateDraftInvoiceCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Invoice>> {
  const validationResult = await validateUpdateDraftInvoice(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const { invoiceId, payload: data } = validationResult.data;
  const result = await invoiceRepository.updateDraftInvoice(tenantId, invoiceId, data);

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
