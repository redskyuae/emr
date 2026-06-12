import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { religionRepository } from '../repository/religion-repository';
import type { Religion } from '../schemas/religion-schema';
import { validateReligionId } from '../validator/religion-id-validator';
import { validateUpdateReligion } from '../validator/update-religion-validator';

export async function updateReligionCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<Religion>> {
  const idValidationResult = validateReligionId(id);
  const payloadValidationResult = validateUpdateReligion(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const existingReligion = await religionRepository.getReligionById(idValidationResult.data);

  if (!existingReligion) {
    return {
      success: false,
      errors: ['Religion not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const [existingName, existingCode] = await Promise.all([
    religionRepository.findActiveByName(payloadValidationResult.data.name, {
      excludeId: idValidationResult.data,
    }),
    religionRepository.findActiveByCode(payloadValidationResult.data.code, {
      excludeId: idValidationResult.data,
    }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Religion name ${payloadValidationResult.data.name} already exists.`);
  }

  if (existingCode) {
    errors.push(`Religion code ${payloadValidationResult.data.code} already exists.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  try {
    const updatedReligion = await religionRepository.updateReligion(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedReligion) {
      return {
        success: false,
        errors: ['Religion not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedReligion };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors: string[] = [];
      if (err.constraint === 'religion_name_idx') {
        constraintErrors.push(`Religion name ${payloadValidationResult.data.name} already exists.`);
      }
      if (err.constraint === 'religion_code_idx') {
        constraintErrors.push(`Religion code ${payloadValidationResult.data.code} already exists.`);
      }
      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
      }
    }
    throw error;
  }
}
