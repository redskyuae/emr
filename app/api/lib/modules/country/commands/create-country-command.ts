import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../repository/country-repository';
import type { Country } from '../schemas/country-schema';
import { validateCreateCountry } from '../validator/create-country-validator';

const CONFLICT_STATUS = 409;

export async function createCountryCommand(payload: unknown): Promise<CommandResult<Country>> {
  const validationResult = validateCreateCountry(payload);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const [existingName, existingCode] = await Promise.all([
    countryRepository.findActiveByName(validationResult.data.name),
    countryRepository.findActiveByCode(validationResult.data.code),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Country name ${validationResult.data.name} already exists.`);
  }

  if (existingCode) {
    errors.push(`Country code ${validationResult.data.code} already exists.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  const createdCountry = await countryRepository.createCountry(validationResult.data);

  return { success: true, data: createdCountry };
}
