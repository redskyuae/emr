import type { Language } from '@/app/api/lib/modules/language/schemas/language-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListLanguagesResponse = Paginated<Language>;

export type SaveLanguageRequest = {
  name: string;
  code: string;
};

export type SaveLanguageResponse = {
  data: Language;
};
