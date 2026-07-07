import { StatusCodes } from 'http-status-codes';

import { countryRepository } from '../../country/repository/country-repository';
import { languageRepository } from '../../language/repository/language-repository';
import { nationalityRepository } from '../../nationality/repository/nationality-repository';
import { religionRepository } from '../../religion/repository/religion-repository';
import { stateRepository } from '../../state/repository/state-repository';
import type { CreatePatientInput, UpdatePatientInput } from '../schemas/patient-schema';
import type { ValidationResult } from '@/app/api/lib/utils/types';

type PatientReferenceInput = Pick<
  CreatePatientInput | UpdatePatientInput,
  'countryId' | 'languageId' | 'nationalityId' | 'religionId' | 'stateId'
>;

export async function validatePatientReferences(
  input: PatientReferenceInput
): Promise<ValidationResult<void>> {
  const [state, country, nationality, language, religion] = await Promise.all([
    input.stateId ? stateRepository.getStateById(input.stateId) : Promise.resolve(undefined),
    input.countryId
      ? countryRepository.getCountryById(input.countryId)
      : Promise.resolve(undefined),
    input.nationalityId
      ? nationalityRepository.getNationalityById(input.nationalityId)
      : Promise.resolve(undefined),
    input.languageId
      ? languageRepository.getLanguageById(input.languageId)
      : Promise.resolve(undefined),
    input.religionId
      ? religionRepository.getReligionById(input.religionId)
      : Promise.resolve(undefined),
  ]);

  const errors: string[] = [];

  if (input.countryId && !country) {
    errors.push(`Patient country ${input.countryId} is Invalid.`);
  }

  if (input.stateId && !state) {
    errors.push(`Patient state ${input.stateId} is Invalid.`);
  }

  if (input.stateId && state && input.countryId && state.countryId !== input.countryId) {
    errors.push(`Patient state ${input.stateId} does not belong to country ${input.countryId}.`);
  }

  if (input.nationalityId && !nationality) {
    errors.push(`Patient nationality ${input.nationalityId} is Invalid.`);
  }

  if (input.languageId && !language) {
    errors.push(`Patient language ${input.languageId} is Invalid.`);
  }

  if (input.religionId && !religion) {
    errors.push(`Patient religion ${input.religionId} is Invalid.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}
