import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Language } from '../schemas/language-schema';
import { languageRepository } from '../repository/language-repository';
import { validateLanguageId } from '../validator/language-id-validator';
import { validateUpdateLanguage } from '../validator/update-language-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateLanguageCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<Language>> {
  const idValidationResult = validateLanguageId(id);
  const payloadValidationResult = validateUpdateLanguage(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const existingLanguage = await languageRepository.getLanguageById(idValidationResult.data);

  if (!existingLanguage) {
    return {
      success: false,
      errors: ['Language not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const [existingName, existingCode] = await Promise.all([
    languageRepository.findActiveByName(payloadValidationResult.data.name, {
      excludeId: idValidationResult.data,
    }),
    languageRepository.findActiveByCode(payloadValidationResult.data.code, {
      excludeId: idValidationResult.data,
    }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Language name ${payloadValidationResult.data.name} already exists.`);
  }

  if (existingCode) {
    errors.push(`Language code ${payloadValidationResult.data.code} already exists.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  const updatedLanguage = await languageRepository.updateLanguage(
    idValidationResult.data,
    payloadValidationResult.data
  );

  if (!updatedLanguage) {
    return {
      success: false,
      errors: ['Language not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: updatedLanguage };
}
