import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admissionTypeRepository } from '../repository/admission-type-repository';
import type { AdmissionType } from '../schemas/admission-type-schema';
import { validateCreateAdmissionType } from '../validator/create-admission-type-validator';
import { getAdmissionTypeUniqueConstraintErrors } from '../validator/admission-type-uniqueness-validator';

export async function createAdmissionTypeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AdmissionType>> {
  const validationResult = await validateCreateAdmissionType(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const admissionTypeData = { ...validationResult.data, tenantId };

  try {
    const createdAdmissionType =
      await admissionTypeRepository.createAdmissionType(admissionTypeData);
    return { success: true, data: createdAdmissionType };
  } catch (error) {
    const constraintErrors = getAdmissionTypeUniqueConstraintErrors(error, admissionTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
