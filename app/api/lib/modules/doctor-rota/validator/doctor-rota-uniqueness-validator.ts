import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { doctorRotaRepository } from '../repository/doctor-rota-repository';

const DOCTOR_ROTA_NAME_EXISTS = "Doctor rota name '{value}' already exists.";

type DoctorRotaUniquenessInput = {
  name: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(value: string) {
  return DOCTOR_ROTA_NAME_EXISTS.replace('{value}', value);
}

export async function validateDoctorRotaUniqueness({
  tenantId,
  name,
  excludeId,
}: DoctorRotaUniquenessInput): Promise<ValidationResult<void>> {
  const existingName = await doctorRotaRepository.findActiveByName(tenantId, name, { excludeId });

  if (existingName) {
    return { success: false, errors: [duplicateError(name)], status: StatusCodes.CONFLICT };
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

  return [];
}
