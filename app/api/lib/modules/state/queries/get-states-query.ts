import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { countryRepository } from '../../country/repository/country-repository';
import { stateRepository } from '../repository/state-repository';
import type { State, StateListParams } from '../schemas/state-schema';
import { validateStateCountryId } from '../validator/state-country-id-validator';

const VALIDATION_STATUS = 400;

export async function getStatesQuery({
  page = 1,
  limit = 10,
  query,
  countryId,
}: StateListParams = {}): Promise<ListQueryResult<State>> {
  if (countryId !== undefined) {
    const validationResult = validateStateCountryId(countryId);

    if (!validationResult.success) {
      return { success: false, errors: validationResult.errors };
    }

    const country = await countryRepository.getCountryById(validationResult.data);

    if (!country) {
      return {
        success: false,
        errors: ['countryId: Country not found'],
        status: VALIDATION_STATUS,
      };
    }
  }

  const { data, total } = await stateRepository.getStates({ page, limit, query, countryId });

  return { success: true, data, total };
}
