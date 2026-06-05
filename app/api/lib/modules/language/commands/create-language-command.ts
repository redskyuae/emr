import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Language } from '../schemas/language-schema';
import { languageRepository } from '../repository/language-repository';
import { validateCreateLanguage } from '../validator/create-language-validator';

const CONFLICT_STATUS = 409;

export async function createLanguageCommand(payload: unknown): Promise<CommandResult<Language>> {
  const validationResult = validateCreateLanguage(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const [existingName, existingCode] = await Promise.all([
    languageRepository.findActiveByName(validationResult.data.name),
    languageRepository.findActiveByCode(validationResult.data.code),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Language name ${validationResult.data.name} already exists.`);
  }

  if (existingCode) {
    errors.push(`Language code ${validationResult.data.code} already exists.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  try {
    const createdLanguage = await languageRepository.createLanguage(validationResult.data);
    return { success: true, data: createdLanguage };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors: string[] = [];
      if (err.constraint === 'language_name_idx') {
        constraintErrors.push(`Language name ${validationResult.data.name} already exists.`);
      }
      if (err.constraint === 'language_code_idx') {
        constraintErrors.push(`Language code ${validationResult.data.code} already exists.`);
      }
      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
      }
    }
    throw error;
  }
}
