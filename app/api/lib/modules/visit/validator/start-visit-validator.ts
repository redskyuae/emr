import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { startVisitSchema } from '../schemas/visit-schema';
import { validateVisitExists } from './visit-existence-validator';
import { resolveVisitTargetStatus } from './resolve-visit-target-status';

export type StartVisitParams = { id: number; statusId: number; expectedStatusId: number };

export async function validateStartVisit(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<StartVisitParams>> {
  const payloadResult = startVisitSchema.safeParse(payload);
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

  if (visit.status.category !== 'WAITING') {
    return {
      success: false,
      errors: ['Only a Visit that is Waiting can be started.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!visit.doctorId) {
    return {
      success: false,
      errors: ['Visit must have a Doctor assigned before it can be started.'],
      status: StatusCodes.CONFLICT,
    };
  }

  const doctor = await doctorRepository.getDoctorById(visit.doctorId, tenantId);

  if (!doctor || !doctor.isActive) {
    return {
      success: false,
      errors: ['Visit doctor is Inactive and cannot be assigned to a Visit.'],
      status: StatusCodes.CONFLICT,
    };
  }

  const statusResult = await resolveVisitTargetStatus(
    tenantId,
    'IN_PROGRESS',
    payloadResult.data.statusId
  );

  if (!statusResult.success) {
    return { success: false, errors: statusResult.errors, status: statusResult.status };
  }

  return {
    success: true,
    data: { id: visit.id, statusId: statusResult.data, expectedStatusId: visit.statusId },
  };
}
