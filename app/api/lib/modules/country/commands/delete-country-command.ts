import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../repository/country-repository';
import type { Country } from '../schemas/country-schema';
import { validateCountryId } from '../validator/country-id-validator';

const NOT_FOUND_STATUS = 404;

export async function deleteCountryCommand(id: unknown): Promise<CommandResult<Country>> {
  const validationResult = validateCountryId(id);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedCountry = await countryRepository.softDeleteCountry(validationResult.data);

  if (!deletedCountry) {
    return {
      success: false,
      errors: ['Country not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  return { success: true, data: deletedCountry };
}
