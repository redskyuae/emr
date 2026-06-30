import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { appointmentStatusRepository } from '../repository/appointment-status-repository';
const APPOINTMENT_STATUS_NAME_EXISTS = "Appointment status name '{value}' already exists.";
const APPOINTMENT_STATUS_CODE_EXISTS = "Appointment status code '{value}' already exists.";

type AppointmentStatusUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAppointmentStatusUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AppointmentStatusUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    appointmentStatusRepository.findActiveByName(tenantId, name, { excludeId }),
    appointmentStatusRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(APPOINTMENT_STATUS_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(APPOINTMENT_STATUS_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAppointmentStatusUniqueConstraintErrors(
  error: unknown,
  input: Pick<AppointmentStatusUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'appointment_status_tenant_name_idx') {
    return [duplicateError(APPOINTMENT_STATUS_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'appointment_status_tenant_code_idx') {
    return [duplicateError(APPOINTMENT_STATUS_CODE_EXISTS, input.code)];
  }

  return [];
}
