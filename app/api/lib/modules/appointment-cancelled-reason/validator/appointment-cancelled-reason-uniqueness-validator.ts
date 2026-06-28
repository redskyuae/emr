import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { appointmentCancelledReasonRepository } from '../repository/appointment-cancelled-reason-repository';
const APPOINTMENT_CANCELLED_REASON_NAME_EXISTS =
  "Appointment cancelled reason name '{value}' already exists.";
const APPOINTMENT_CANCELLED_REASON_CODE_EXISTS =
  "Appointment cancelled reason code '{value}' already exists.";

type AppointmentCancelledReasonUniquenessInput = {
  name: string;
  code: string;
  tenantId: string;
  excludeId?: number;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateAppointmentCancelledReasonUniqueness({
  tenantId,
  name,
  code,
  excludeId,
}: AppointmentCancelledReasonUniquenessInput): Promise<ValidationResult<void>> {
  const [existingName, existingCode] = await Promise.all([
    appointmentCancelledReasonRepository.findActiveByName(tenantId, name, { excludeId }),
    appointmentCancelledReasonRepository.findActiveByCode(tenantId, code, { excludeId }),
  ]);

  const errors: string[] = [];

  if (existingName) {
    errors.push(duplicateError(APPOINTMENT_CANCELLED_REASON_NAME_EXISTS, name));
  }

  if (existingCode) {
    errors.push(duplicateError(APPOINTMENT_CANCELLED_REASON_CODE_EXISTS, code));
  }

  if (errors.length > 0) {
    return { errors, success: false, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}

export function getAppointmentCancelledReasonUniqueConstraintErrors(
  error: unknown,
  input: Pick<AppointmentCancelledReasonUniquenessInput, 'name' | 'code'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'appointment_cancelled_reason_tenant_name_idx') {
    return [duplicateError(APPOINTMENT_CANCELLED_REASON_NAME_EXISTS, input.name)];
  }

  if (err.constraint === 'appointment_cancelled_reason_tenant_code_idx') {
    return [duplicateError(APPOINTMENT_CANCELLED_REASON_CODE_EXISTS, input.code)];
  }

  return [];
}
