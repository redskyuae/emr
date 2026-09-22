import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { therapistRepository } from '../repository/therapist-repository';
import type { Therapist } from '../schemas/therapist-schema';
import { validateGetTherapists } from '../validator/get-therapists-validator';

export async function getTherapistsQuery(input: unknown): Promise<ListQueryResult<Therapist>> {
  const validation = validateGetTherapists(input);
  if (!validation.success) return validation;
  const { data, total } = await therapistRepository.getTherapists(validation.data);
  return { success: true, data, total };
}
