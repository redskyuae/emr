import type { Country } from '@/app/api/lib/modules/country/schemas/country-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListCountriesResponse = Paginated<Country>;

export type SaveCountryRequest = {
  name: string;
  code: string;
};

export type SaveCountryResponse = {
  data: Country;
};
