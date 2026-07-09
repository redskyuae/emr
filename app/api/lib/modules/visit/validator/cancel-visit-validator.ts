import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { cancelVisitSchema } from '../schemas/visit-schema';
import { validateVisitExists } from './visit-existence-validator';
import { resolveVisitTargetStatus } from './resolve-visit-target-status';

export type CancelVisitParams = {
  id: number;
  statusId: number;
  cancelledReason: string;
  expectedStatusId: number;
};

export async function validateCancelVisit(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CancelVisitParams>> {
  const payloadResult = cancelVisitSchema.safeParse(payload);
  const existsResult = await validateVisitExists(id, tenantId);

  if (!existsResult.success) {
    const errors = payloadResult.success
      ? existsResult.errors
      : [...existsResult.errors, ...formatValidationErrors(payloadResult.error)];

    return { success: false, errors, status: existsResult.status };
  }

  if (!payloadResult.success) {
    return { success: false, errors: formatValidationErrors(payloadResult.error) };
  }

  const visit = existsResult.data;

  if (visit.status.category !== 'WAITING' && visit.status.category !== 'IN_PROGRESS') {
    return {
      success: false,
      errors: ['Only a Visit that is Waiting or In Progress can be cancelled.'],
      status: StatusCodes.CONFLICT,
    };
  }

  const statusResult = await resolveVisitTargetStatus(
    tenantId,
    'CANCELLED',
    payloadResult.data.statusId
  );

  if (!statusResult.success) {
    return { success: false, errors: statusResult.errors, status: statusResult.status };
  }

  return {
    success: true,
    data: {
      id: visit.id,
      statusId: statusResult.data,
      cancelledReason: payloadResult.data.cancelledReason,
      expectedStatusId: visit.statusId,
    },
  };
}
