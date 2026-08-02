import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Language } from '../schemas/language-schema';
import { languageRepository } from '../repository/language-repository';
import { validateLanguageId } from '../validator/language-id-validator';
import { validateUpdateLanguage } from '../validator/update-language-validator';
import {
  getLanguageUniqueConstraintErrors,
  validateLanguageUniqueness,
} from '../validator/language-uniqueness-validator';

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
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateLanguageUniqueness({
    ...payloadValidationResult.data,
    excludeId: idValidationResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status ?? StatusCodes.CONFLICT,
    };
  }

  try {
    const updatedLanguage = await languageRepository.updateLanguage(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedLanguage) {
      return {
        success: false,
        errors: ['Language not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedLanguage };
  } catch (error) {
    const constraintErrors = getLanguageUniqueConstraintErrors(error, payloadValidationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
