import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { admissionTypeRepository } from '../repository/admission-type-repository';
import type { AdmissionType } from '../schemas/admission-type-schema';
import { validateGetAdmissionTypeById } from '../validator/get-admission-type-by-id-validator';

export async function getAdmissionTypeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AdmissionType>> {
  const validationResult = validateGetAdmissionTypeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const admissionType = await admissionTypeRepository.getAdmissionTypeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!admissionType) {
    return {
      success: false,
      errors: ['Admission type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: admissionType };
}
