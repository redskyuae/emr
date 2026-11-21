import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitRepository } from '../../visit/repository/visit-repository';
import {
  visitDiagnosisTenantIdSchema,
  visitDiagnosisVisitIdSchema,
} from '../schemas/visit-diagnosis-schema';

type ListVisitDiagnosesParams = {
  tenantId: string;
  visitId: number;
};

export async function validateListVisitDiagnoses(
  visitId: unknown,
  tenantId: unknown
): Promise<ValidationResult<ListVisitDiagnosesParams>> {
  const tenantIdResult = visitDiagnosisTenantIdSchema.safeParse(tenantId);
  const visitIdResult = visitDiagnosisVisitIdSchema.safeParse(visitId);

  if (!tenantIdResult.success || !visitIdResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!visitIdResult.success) {
      errors.push(`Visit ${String(visitId)} is Invalid.`);
    }

    return { success: false, errors };
  }

  const visit = await visitRepository.getVisitById(visitIdResult.data, tenantIdResult.data);

  if (!visit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  return { success: true, data: { tenantId: tenantIdResult.data, visitId: visitIdResult.data } };
}
