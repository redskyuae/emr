import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { treatmentRepository } from '../repository/treatment-repository';
import { treatmentIdSchema, treatmentTenantIdSchema } from '../schemas/treatment-schema';

export type DeleteTreatmentInput = {
  id: number;
  tenantId: string;
};

type TreatmentUsageReader = Pick<typeof treatmentRepository, 'isTreatmentInUse'>;

export async function validateDeleteTreatment(
  id: unknown,
  tenantId: unknown,
  usage: TreatmentUsageReader = treatmentRepository
): Promise<ValidationResult<DeleteTreatmentInput>> {
  const idResult = treatmentIdSchema.safeParse(id);
  const tenantIdResult = treatmentTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Treatment ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  if (await usage.isTreatmentInUse(idResult.data, tenantIdResult.data)) {
    return {
      success: false,
      errors: ['Treatment cannot be deleted while it is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      tenantId: tenantIdResult.data,
    },
  };
}
