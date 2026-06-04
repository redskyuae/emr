import type { ListQueryResult } from '@/app/api/lib/utils/types';
import type { Language, LanguageListParams } from '../schemas/language-schema';
import { languageRepository } from '../repository/language-repository';

export async function getLanguagesQuery({
  page = 1,
  limit = 10,
  query,
}: LanguageListParams = {}): Promise<ListQueryResult<Language>> {
  const { data, total } = await languageRepository.getLanguages({ page, limit, query });

  return { success: true, data, total };
}
