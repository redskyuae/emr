import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateDeleteInvoice } from '../validator/delete-invoice-validator';

export async function deleteInvoiceCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Invoice>> {
  const validationResult = await validateDeleteInvoice(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await invoiceRepository.deleteInvoice(
    validationResult.data.tenantId,
    validationResult.data.id
  );

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Invoice not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'not-deletable') {
    return {
      success: false,
      errors: [`Invoice ${result.data.invoiceNumber} cannot be removed once finalized.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: result.data };
}
