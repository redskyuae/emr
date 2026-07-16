import type { Allergen } from '@/app/api/lib/modules/allergen/schemas/allergen-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListAllergensResponse = Paginated<Allergen>;

export type SaveAllergenRequest = {
  name: string;
  code: string;
  category: string;
};

export type SaveAllergenResponse = {
  data: Allergen;
};
