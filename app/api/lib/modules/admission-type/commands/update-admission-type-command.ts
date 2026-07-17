import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admissionTypeRepository } from '../repository/admission-type-repository';
import type { AdmissionType } from '../schemas/admission-type-schema';
import { validateUpdateAdmissionType } from '../validator/update-admission-type-validator';
import { getAdmissionTypeUniqueConstraintErrors } from '../validator/admission-type-uniqueness-validator';

export async function updateAdmissionTypeCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AdmissionType>> {
  const validationResult = await validateUpdateAdmissionType(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const admissionTypeData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAdmissionType = await admissionTypeRepository.updateAdmissionType(
      validationResult.data.id,
      admissionTypeData
    );

    if (!updatedAdmissionType) {
      return {
        success: false,
        errors: ['Admission type not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAdmissionType };
  } catch (error) {
    const constraintErrors = getAdmissionTypeUniqueConstraintErrors(error, admissionTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
