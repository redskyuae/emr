import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitStatusRepository } from '../../visit-status/repository/visit-status-repository';
import { visitRepository } from '../repository/visit-repository';
import { createVisitSchema, type CreateVisitInput } from '../schemas/visit-schema';
import { validateVisitReferences } from './visit-reference-validator';

export type CreateVisitValidated = CreateVisitInput & { statusId: number };

export async function validateCreateVisit(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateVisitValidated>> {
  const result = createVisitSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const referenceResult = await validateVisitReferences(tenantId, result.data);

  if (!referenceResult.success) {
    return { success: false, errors: referenceResult.errors, status: referenceResult.status };
  }

  const openVisit = await visitRepository.findOpenVisitByPatientId(tenantId, result.data.patientId);

  if (openVisit) {
    return {
      success: false,
      errors: [
        `Patient already has an Open Visit (${openVisit.visitNumber}). Complete or cancel it before starting a new Visit.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  const waitingStatus = await visitStatusRepository.getSystemVisitStatusByCategory(
    tenantId,
    'WAITING'
  );

  if (!waitingStatus) {
    return {
      success: false,
      errors: ['No Waiting Visit status is configured for this Tenant.'],
      status: StatusCodes.CONFLICT,
    };
  }

  return { success: true, data: { ...result.data, statusId: waitingStatus.id } };
}
