import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { specialtyRepository } from '../repository/specialty-repository';
import { specialtyIdSchema, specialtyTenantIdSchema } from '../schemas/specialty-schema';

export type DeleteSpecialtyInput = {
  id: number;
  tenantId: string;
};

export async function validateDeleteSpecialty(
  id: unknown,
  tenantId: unknown
): Promise<ValidationResult<DeleteSpecialtyInput>> {
  const idResult = specialtyIdSchema.safeParse(id);
  const tenantIdResult = specialtyTenantIdSchema.safeParse(tenantId);

  if (!idResult.success || !tenantIdResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Specialty ${String(id)} is Invalid.`);
    }

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    return { success: false, errors };
  }

  const existingSpecialty = await specialtyRepository.getSpecialtyById(
    idResult.data,
    tenantIdResult.data
  );

  if (!existingSpecialty) {
    return {
      success: false,
      errors: ['Specialty not found'],
      status: StatusCodes.NOT_FOUND,
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
