import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateFinalizeInvoice } from '../validator/finalize-invoice-validator';

export async function finalizeInvoiceCommand(
  id: unknown,
  tenantId: string
): Promise<CommandResult<Invoice>> {
  const validationResult = await validateFinalizeInvoice(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await invoiceRepository.finalizeInvoice(
    validationResult.data.tenantId,
    validationResult.data.id
  );

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

  if (result.outcome === 'no-lines') {
    return {
      success: false,
      errors: [`Invoice ${result.data.invoiceNumber} has no lines to finalize.`],
      status: StatusCodes.CONFLICT,
    };
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
