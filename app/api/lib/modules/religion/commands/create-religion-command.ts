import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { religionRepository } from '../repository/religion-repository';
import type { Religion } from '../schemas/religion-schema';
import { validateCreateReligion } from '../validator/create-religion-validator';

export async function createReligionCommand(payload: unknown): Promise<CommandResult<Religion>> {
  const validationResult = validateCreateReligion(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const [existingName, existingCode] = await Promise.all([
    religionRepository.findActiveByName(validationResult.data.name),
    religionRepository.findActiveByCode(validationResult.data.code),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Religion name ${validationResult.data.name} already exists.`);
  }

  if (existingCode) {
    errors.push(`Religion code ${validationResult.data.code} already exists.`);
  }

  if (errors.length > 0) {
    return { errors, success: false, status: StatusCodes.CONFLICT };
  }

  try {
    const createdReligion = await religionRepository.createReligion(validationResult.data);
    return { success: true, data: createdReligion };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors: string[] = [];
      if (err.constraint === 'religion_name_idx') {
        constraintErrors.push(`Religion name ${validationResult.data.name} already exists.`);
      }
      if (err.constraint === 'religion_code_idx') {
        constraintErrors.push(`Religion code ${validationResult.data.code} already exists.`);
      }
      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
      }
    }
    throw error;
  }
}
