import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Nationality } from '../schemas/nationality-schema';
import { nationalityRepository } from '../repository/nationality-repository';
import { validateNationalityId } from '../validator/nationality-id-validator';
import { validateUpdateNationality } from '../validator/update-nationality-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateNationalityCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<Nationality>> {
  const idValidationResult = validateNationalityId(id);
  const payloadValidationResult = validateUpdateNationality(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const existingNationality = await nationalityRepository.getNationalityById(
    idValidationResult.data
  );

  if (!existingNationality) {
    return {
      success: false,
      errors: ['Nationality not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const [existingName, existingCode] = await Promise.all([
    nationalityRepository.findActiveByName(payloadValidationResult.data.name, {
      excludeId: idValidationResult.data,
    }),
    nationalityRepository.findActiveByCode(payloadValidationResult.data.code, {
      excludeId: idValidationResult.data,
    }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Nationality name ${payloadValidationResult.data.name} already exist`);
  }

  if (existingCode) {
    errors.push(`Nationality code ${payloadValidationResult.data.code} already exist`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  const updatedNationality = await nationalityRepository.updateNationality(
    idValidationResult.data,
    payloadValidationResult.data
  );

  if (!updatedNationality) {
    return {
      success: false,
      errors: ['Nationality not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: updatedNationality };
}
