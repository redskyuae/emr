import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admissionRepository } from '../repository/admission-repository';
import type { Admission } from '../schemas/admission-schema';
import { validateCancelAdmission } from '../validator/cancel-admission-validator';

export async function cancelAdmissionCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Admission>> {
  const validationResult = validateCancelAdmission(id, payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const result = await admissionRepository.cancelAdmission(
    validationResult.data.id,
    tenantId,
    validationResult.data.payload.cancellationReason
  );

  if (result.outcome === 'not-found') {
    return { success: false, errors: ['Admission not found'], status: StatusCodes.NOT_FOUND };
  }

  if (result.outcome === 'invalid-status') {
    return {
      success: false,
      errors: [
        `Admission ${result.data.admissionNumber} cannot be cancelled from its current status.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: result.data };
}
