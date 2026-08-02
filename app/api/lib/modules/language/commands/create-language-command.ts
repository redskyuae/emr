import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Language } from '../schemas/language-schema';
import { languageRepository } from '../repository/language-repository';
import { validateCreateLanguage } from '../validator/create-language-validator';
import {
  getLanguageUniqueConstraintErrors,
  validateLanguageUniqueness,
} from '../validator/language-uniqueness-validator';

export async function createLanguageCommand(payload: unknown): Promise<CommandResult<Language>> {
  const validationResult = validateCreateLanguage(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const uniquenessResult = await validateLanguageUniqueness(validationResult.data);

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status ?? StatusCodes.CONFLICT,
    };
  }

  try {
    const createdLanguage = await languageRepository.createLanguage(validationResult.data);
    return { success: true, data: createdLanguage };
  } catch (error) {
    const constraintErrors = getLanguageUniqueConstraintErrors(error, validationResult.data);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
