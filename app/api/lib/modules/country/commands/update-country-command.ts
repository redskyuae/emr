import type { CommandResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../repository/country-repository';
import type { Country } from '../schemas/country-schema';
import { validateCountryId } from '../validator/country-id-validator';
import { validateUpdateCountry } from '../validator/update-country-validator';

const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

export async function updateCountryCommand(
  id: unknown,
  payload: unknown
): Promise<CommandResult<Country>> {
  const idValidationResult = validateCountryId(id);
  const payloadValidationResult = validateUpdateCountry(payload);

  if (!idValidationResult.success) {
    return { success: false, errors: idValidationResult.errors };
  }

  if (!payloadValidationResult.success) {
    return { success: false, errors: payloadValidationResult.errors };
  }

  const existingCountry = await countryRepository.getCountryById(idValidationResult.data);

  if (!existingCountry) {
    return {
      success: false,
      errors: ['Country not found'],
      status: NOT_FOUND_STATUS,
    };
  }

  const [existingName, existingCode] = await Promise.all([
    countryRepository.findActiveByName(payloadValidationResult.data.name, {
      excludeId: idValidationResult.data,
    }),
    countryRepository.findActiveByCode(payloadValidationResult.data.code, {
      excludeId: idValidationResult.data,
    }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(`Country name ${payloadValidationResult.data.name} already exists.`);
  }

  if (existingCode) {
    errors.push(`Country code ${payloadValidationResult.data.code} already exists.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  try {
    const updatedCountry = await countryRepository.updateCountry(
      idValidationResult.data,
      payloadValidationResult.data
    );

    if (!updatedCountry) {
      return {
        success: false,
        errors: ['Country not found'],
        status: NOT_FOUND_STATUS,
      };
    }

    return { success: true, data: updatedCountry };
  } catch (error) {
    const err = error as Record<string, unknown>;
    if (err.code === '23505') {
      const constraintErrors: string[] = [];
      if (err.constraint === 'country_name_idx') {
        constraintErrors.push(`Country name ${payloadValidationResult.data.name} already exists.`);
      }
      if (err.constraint === 'country_code_idx') {
        constraintErrors.push(`Country code ${payloadValidationResult.data.code} already exists.`);
      }
      if (constraintErrors.length > 0) {
        return { success: false, errors: constraintErrors, status: CONFLICT_STATUS };
      }
    }
    throw error;
  }
}
