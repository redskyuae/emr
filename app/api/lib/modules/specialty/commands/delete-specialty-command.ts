import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { specialtyRepository } from '../repository/specialty-repository';
import type { Specialty } from '../schemas/specialty-schema';
import { validateDeleteSpecialty } from '../validator/delete-specialty-validator';

export async function deleteSpecialtyCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Specialty>> {
  const validationResult = await validateDeleteSpecialty(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedSpecialty = await specialtyRepository.deleteSpecialty(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedSpecialty) {
    return {
      success: false,
      errors: ['Specialty not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedSpecialty };
}
