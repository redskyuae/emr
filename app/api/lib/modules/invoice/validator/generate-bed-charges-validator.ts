import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionRepository } from '@/app/api/lib/modules/admission/repository/admission-repository';
import { invoiceRepository } from '../repository/invoice-repository';
import { invoiceIdSchema, invoiceTenantIdSchema } from '../schemas/invoice-schema';

export type ValidatedGenerateBedCharges = {
  invoiceId: number;
  admissionId: number;
  tenantId: string;
};

export async function validateGenerateBedCharges(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<ValidatedGenerateBedCharges>> {
  const idResult = invoiceIdSchema.safeParse(id);
  const tenantIdResult = invoiceTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Invoice ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  const invoice = await invoiceRepository.findInvoiceById(tenantIdResult.data, idResult.data);

  if (!invoice) {
    return { success: false, errors: [`Invoice ${id} is Invalid.`], status: StatusCodes.NOT_FOUND };
  }

  if (invoice.status !== 'DRAFT') {
    return {
      success: false,
      errors: [`Invoice ${invoice.invoiceNumber} can only be edited while in Draft.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (invoice.admissionId === null) {
    return {
      success: false,
      errors: [`Invoice ${invoice.invoiceNumber} is not linked to an Admission.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const admission = await admissionRepository.getAdmissionById(
    invoice.admissionId,
    tenantIdResult.data
  );

  if (!admission) {
    return {
      success: false,
      errors: [`Admission ${invoice.admissionId} is Invalid.`],
      status: StatusCodes.NOT_FOUND,
    };
  }

  if (admission.status !== 'DISCHARGED') {
    return {
      success: false,
      errors: [`Admission ${admission.admissionNumber} is not discharged yet.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: {
      invoiceId: idResult.data,
      admissionId: invoice.admissionId,
      tenantId: tenantIdResult.data,
    },
  };
}
