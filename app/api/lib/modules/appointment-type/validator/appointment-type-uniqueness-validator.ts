import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { appointmentTypeRepository } from '../repository/appointment-type-repository';
const APPOINTMENT_TYPE_NAME_EXISTS = "Appointment type name '{value}' already exists.";
const APPOINTMENT_TYPE_CODE_EXISTS = "Appointment type code '{value}' already exists.";

type AppointmentTypeUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAppointmentTypeUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AppointmentTypeUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    appointmentTypeRepository.findActiveByName(tenantId, name, { excludeId }),
    appointmentTypeRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(APPOINTMENT_TYPE_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(APPOINTMENT_TYPE_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAppointmentTypeUniqueConstraintErrors(
  error: unknown,
  input: Pick<AppointmentTypeUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'appointment_type_tenant_name_idx') {
    return [duplicateError(APPOINTMENT_TYPE_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'appointment_type_tenant_code_idx') {
    return [duplicateError(APPOINTMENT_TYPE_CODE_EXISTS, input.code)];
  }

  return [];
}
