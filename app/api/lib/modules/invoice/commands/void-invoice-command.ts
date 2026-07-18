import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateVoidInvoice } from '../validator/void-invoice-validator';

export async function voidInvoiceCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Invoice>> {
  const validationResult = await validateVoidInvoice(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await invoiceRepository.voidInvoice(
    tenantId,
    validationResult.data.id,
    validationResult.data.voidReason
  );

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Invoice not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'not-voidable') {
    return {
      success: false,
      errors: [
        `Invoice ${result.data.invoiceNumber} cannot be voided after payments are recorded.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: result.data };
}
