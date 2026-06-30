import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { appointmentReasonRepository } from '../repository/appointment-reason-repository';
const APPOINTMENT_REASON_NAME_EXISTS = "Appointment reason name '{value}' already exists.";
const APPOINTMENT_REASON_CODE_EXISTS = "Appointment reason code '{value}' already exists.";

type AppointmentReasonUniquenessInput = {
  tenantId: string;
  name: string;
  code: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAppointmentReasonUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AppointmentReasonUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    appointmentReasonRepository.findActiveByName(tenantId, name, { excludeId }),
    appointmentReasonRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(APPOINTMENT_REASON_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(APPOINTMENT_REASON_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAppointmentReasonUniqueConstraintErrors(
  error: unknown,
  input: Pick<AppointmentReasonUniquenessInput, 'name' | 'code'>
): string[] {
  const dbError = getDatabaseError(error);

  if (dbError?.code !== '23505') {
    return [];
  }

  if (dbError.constraint === 'appointment_reason_tenant_name_idx') {
    return [duplicateError(APPOINTMENT_REASON_NAME_EXISTS, input.name)];
  }

  if (dbError.constraint === 'appointment_reason_tenant_code_idx') {
    return [duplicateError(APPOINTMENT_REASON_CODE_EXISTS, input.code)];
  }

  return [];
}
