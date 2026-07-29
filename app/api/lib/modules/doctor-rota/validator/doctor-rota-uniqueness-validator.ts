import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';

const DOCTOR_ROTA_NAME_EXISTS = "Doctor rota name '{value}' already exists.";
const DOCTOR_ROTA_TIME_RANGE_EXISTS = 'Doctor rota already exists for the selected time range.';

type DoctorRotaUniquenessInput = {
  name: string;
  toTime: string;
  tenantId: string;
  fromTime: string;
  excludeId?: number;
};

function duplicateError(value: string) {
  return DOCTOR_ROTA_NAME_EXISTS.replace('{value}', value);
}

export async function validateDoctorRotaUniqueness({
  tenantId,
  name,
  toTime,
  fromTime,
  excludeId,
}: DoctorRotaUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingTimeRange] = await Promise.all([
    doctorRotaRepository.findActiveByName(tenantId, name, { excludeId }),
    doctorRotaRepository.findActiveByTimeRange(tenantId, fromTime, toTime, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(name));
  }

  if (existingTimeRange) {
    errors.push(DOCTOR_ROTA_TIME_RANGE_EXISTS);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getDoctorRotaUniqueConstraintErrors(
  error: unknown,
  input: Pick<DoctorRotaUniquenessInput, 'name'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'doctor_rota_tenant_name_idx') {
    return [duplicateError(input.name)];
  }

  if (dbError.constraint === 'doctor_rota_tenant_time_range_idx') {
    return [DOCTOR_ROTA_TIME_RANGE_EXISTS];
  }

  return [];
}
