import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { admissionRepository } from '../repository/admission-repository';
import type { AdmissionDetail } from '../schemas/admission-schema';
import { validateGetAdmissionById } from '../validator/get-admission-by-id-validator';

export async function getAdmissionByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<AdmissionDetail>> {
  const validationResult = validateGetAdmissionById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const admission = await admissionRepository.getAdmissionById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!admission) {
    return { success: false, errors: ['Admission not found'], status: StatusCodes.NOT_FOUND };
  }

  const transfers = await admissionRepository.getBedTransfersByAdmissionId(
    validationResult.data.tenantId,
    admission.id
  );

  return { success: true, data: { ...admission, transfers } };
}
