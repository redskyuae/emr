import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../repository/country-repository';
import type { Country, CountryListParams } from '../schemas/country-schema';

export async function getCountriesQuery({
  page = 1,
  limit = 10,
  query,
}: CountryListParams = {}): Promise<ListQueryResult<Country>> {
  const { data, total } = await countryRepository.getCountries({ page, limit, query });

  return { success: true, data, total };
}
