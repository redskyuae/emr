import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../repository/country-repository';
import type { Country } from '../schemas/country-schema';
import { validateCountryId } from '../validator/country-id-validator';

const NOT_FOUND_STATUS = 404;

export async function getCountryByIdQuery(id: unknown): Promise<SingleQueryResult<Country>> {
  const validationResult = validateCountryId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const country = await countryRepository.getCountryById(validationResult.data);

  if (!country) {
    return {
      success: false,
      errors: ['Country not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: country };
}
