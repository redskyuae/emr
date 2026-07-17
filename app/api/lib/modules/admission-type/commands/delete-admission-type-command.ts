import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admissionTypeRepository } from '../repository/admission-type-repository';
import type { AdmissionType } from '../schemas/admission-type-schema';
import { validateDeleteAdmissionType } from '../validator/delete-admission-type-validator';

export async function deleteAdmissionTypeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<AdmissionType>> {
  const validationResult = validateDeleteAdmissionType(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedAdmissionType = await admissionTypeRepository.deleteAdmissionType(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAdmissionType) {
    return {
      success: false,
      errors: ['Admission type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAdmissionType };
}
