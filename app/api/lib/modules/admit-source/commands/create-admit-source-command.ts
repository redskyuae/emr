import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admitSourceRepository } from '../repository/admit-source-repository';
import type { AdmitSource } from '../schemas/admit-source-schema';
import { validateCreateAdmitSource } from '../validator/create-admit-source-validator';
import { getAdmitSourceUniqueConstraintErrors } from '../validator/admit-source-uniqueness-validator';

export async function createAdmitSourceCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<AdmitSource>> {
  const validationResult = await validateCreateAdmitSource(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const admitSourceData = { ...validationResult.data, tenantId };

  try {
    const createdAdmitSource = await admitSourceRepository.createAdmitSource(admitSourceData);
    return { success: true, data: createdAdmitSource };
  } catch (error) {
    const constraintErrors = getAdmitSourceUniqueConstraintErrors(error, admitSourceData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
