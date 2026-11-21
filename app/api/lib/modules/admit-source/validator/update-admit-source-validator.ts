import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admitSourceRepository } from '../repository/admit-source-repository';
import {
  updateAdmitSourceSchema,
  admitSourceIdSchema,
  type UpdateAdmitSourceInput,
} from '../schemas/admit-source-schema';
import { validateAdmitSourceUniqueness } from './admit-source-uniqueness-validator';

type UpdateAdmitSourceParams = {
  id: number;
  payload: UpdateAdmitSourceInput;
};

export async function validateUpdateAdmitSource(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAdmitSourceParams>> {
  const idResult = admitSourceIdSchema.safeParse(id);
  const payloadResult = updateAdmitSourceSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Admit source ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAdmitSource = await admitSourceRepository.getAdmitSourceById(
    idResult.data,
    tenantId
  );

  if (!existingAdmitSource) {
    return {
      success: false,
      errors: ['Admit source not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAdmitSourceUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
