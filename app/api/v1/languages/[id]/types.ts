import type { Language } from '@/app/api/lib/modules/language/schemas/language-schema';

export type GetLanguageResponse = {
  data: Language;
};

export type UpdateLanguageRequest = {
  name: string;
  code: string;
};

export type UpdateLanguageResponse = {
  data: Language;
};

export type DeleteLanguageResponse = void;
