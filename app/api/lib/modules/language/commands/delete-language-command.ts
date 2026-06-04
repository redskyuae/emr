import type { CommandResult } from '@/app/api/lib/utils/types';
import type { Language } from '../schemas/language-schema';
import { languageRepository } from '../repository/language-repository';
import { validateLanguageId } from '../validator/language-id-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteLanguageCommand(id: unknown): Promise<CommandResult<Language>> {
  const validationResult = validateLanguageId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedLanguage = await languageRepository.softDeleteLanguage(validationResult.data);

  if (!deletedLanguage) {
    return {
      success: false,
      errors: ['Language not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedLanguage };
}
