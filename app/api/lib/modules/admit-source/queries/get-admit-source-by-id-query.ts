import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { admitSourceRepository } from '../repository/admit-source-repository';
import type { AdmitSource } from '../schemas/admit-source-schema';
import { validateGetAdmitSourceById } from '../validator/get-admit-source-by-id-validator';

export async function getAdmitSourceByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AdmitSource>> {
  const validationResult = validateGetAdmitSourceById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const admitSource = await admitSourceRepository.getAdmitSourceById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!admitSource) {
    return {
      success: false,
      errors: ['Admit source not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: admitSource };
}
