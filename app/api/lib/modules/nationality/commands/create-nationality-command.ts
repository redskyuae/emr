import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Nationality } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';
import { validateCreateNationality } from '../validator/create-nationality-validator';

const CONFLICT_STATUS = 409;

export async function createNationalityCommand(
  payload: unknown
): Promise<CommandResult<Nationality>> {
  const validationResult = validateCreateNationality(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const [existingName, existingCode] = await Promise.all([
    nationalityRepository.findActiveByName(validationResult.data.name),
    nationalityRepository.findActiveByCode(validationResult.data.code),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Nationality name ${validationResult.data.name} already exists`);
  }

  if (existingCode) {
    errors.push(`Nationality code ${validationResult.data.code} already exists`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  try {
    const createdNationality = await nationalityRepository.createNationality(validationResult.data);
    return { success: true, data: createdNationality };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors: string[] = [];
      if (err.constraint === 'nationality_name_idx') {
        constraintErrors.push(`Nationality name ${validationResult.data.name} already exists.`);
      }
      if (err.constraint === 'nationality_code_idx') {
        constraintErrors.push(`Nationality code ${validationResult.data.code} already exists.`);
      }
      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
      }
    }
    throw error;
  }
}
