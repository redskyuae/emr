import type { Allergen } from '@/app/api/lib/modules/allergen/schemas/allergen-schema';

export type GetAllergenResponse = {
  data: Allergen;
};

export type UpdateAllergenRequest = {
  name: string;
  code: string;
  category: string;
};

export type UpdateAllergenResponse = {
  data: Allergen;
};

export type DeleteAllergenResponse = void;
