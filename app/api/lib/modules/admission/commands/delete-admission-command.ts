import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admissionRepository } from '../repository/admission-repository';
import type { Admission } from '../schemas/admission-schema';
import { validateGetAdmissionById } from '../validator/get-admission-by-id-validator';

export async function deleteAdmissionCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Admission>> {
  const validationResult = validateGetAdmissionById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await admissionRepository.deleteAdmission(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Admission not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: result.data };
}
