import { StatusCodes } from 'http-status-codes';

import type { CommandResult } from '@/app/api/lib/utils/types';
import { admitSourceRepository } from '../repository/admit-source-repository';
import type { AdmitSource } from '../schemas/admit-source-schema';
import { validateUpdateAdmitSource } from '../validator/update-admit-source-validator';
import { getAdmitSourceUniqueConstraintErrors } from '../validator/admit-source-uniqueness-validator';

export async function updateAdmitSourceCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<AdmitSource>> {
  const validationResult = await validateUpdateAdmitSource(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const admitSourceData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAdmitSource = await admitSourceRepository.updateAdmitSource(
      validationResult.data.id,
      admitSourceData
    );

    if (!updatedAdmitSource) {
      return {
        success: false,
        errors: ['Admit source not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAdmitSource };
  } catch (error) {
    const constraintErrors = getAdmitSourceUniqueConstraintErrors(error, admitSourceData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
