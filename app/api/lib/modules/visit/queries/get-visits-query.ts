import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { visitRepository } from '../repository/visit-repository';
import type { Visit, VisitListParams } from '../schemas/visit-schema';
import { validateGetVisits } from '../validator/get-visits-validator';

export async function getVisitsQuery(params: VisitListParams): Promise<ListQueryResult<Visit>> {
  const validationResult = validateGetVisits(params);

  if (!validationResult.success) {
    return validationResult;
  }

  const { data, total } = await visitRepository.getVisits(validationResult.data);

  return { success: true, data, total };
}
