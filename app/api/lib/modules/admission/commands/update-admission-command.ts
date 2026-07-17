import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admissionRepository } from '../repository/admission-repository';
import type { Admission } from '../schemas/admission-schema';
import { validateUpdateAdmission } from '../validator/update-admission-validator';

export async function updateAdmissionCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Admission>> {
  const validationResult = await validateUpdateAdmission(id, payload, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const updatedAdmission = await admissionRepository.updateAdmission(
    validationResult.data.id,
    tenantId,
    validationResult.data.payload
  );

  if (!updatedAdmission) {
    return { success: false, errors: ['Admission not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: updatedAdmission };
}
