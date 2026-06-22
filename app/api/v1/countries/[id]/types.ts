import type { Country } from '@/app/api/lib/modules/country/schemas/country-schema';

export type GetCountryResponse = {
  data: Country;
};

export type UpdateCountryRequest = {
  name: string;
  code: string;
};

export type UpdateCountryResponse = {
  data: Country;
};

export type DeleteCountryResponse = void;
