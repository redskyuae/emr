import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { invoiceRepository } from '../repository/invoice-repository';
import type { Invoice } from '../schemas/invoice-schema';
import { validateCreateInvoice } from '../validator/create-invoice-validator';

export async function createInvoiceCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Invoice>> {
  const validationResult = await validateCreateInvoice(payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  try {
    const created = await invoiceRepository.createInvoice({ ...validationResult.data, tenantId });
    return { success: true, data: created };
  } catch (error) {
    const dbError = getDatabaseError(error);

    if (dbError?.code === '23505' && dbError.constraint === 'invoice_tenant_number_idx') {
      return {
        success: false,
        errors: ['Invoice Number allocation conflicted. Please retry.'],
        status: StatusCodes.CONFLICT,
      };
    }

    throw error;
  }
}
