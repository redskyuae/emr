import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../repository/country-repository';
import type { Country } from '../schemas/country-schema';
import { validateCreateCountry } from '../validator/create-country-validator';

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
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  try {
    const createdCountry = await countryRepository.createCountry(validationResult.data);
    return { success: true, data: createdCountry };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors: string[] = [];
      if (err.constraint === 'country_name_idx') {
        constraintErrors.push(`Country name ${validationResult.data.name} already exists.`);
      }
      if (err.constraint === 'country_code_idx') {
        constraintErrors.push(`Country code ${validationResult.data.code} already exists.`);
      }
      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
      }
    }
    throw error;
  }
}
