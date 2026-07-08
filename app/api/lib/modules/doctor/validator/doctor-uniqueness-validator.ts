import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import type { CreateDoctorInput, UpdateDoctorInput } from '../schemas/doctor-schema';

const DOCTOR_EMAIL_EXISTS = 'A Staff member with this email already exists.';
const DOCTOR_REGISTRATION_EXISTS = 'Doctor registration number {value} already exists.';
const STAFF_CODE_EXISTS = "Staff code '{value}' already exists.";

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export function doctorEmailExistsError() {
  return DOCTOR_EMAIL_EXISTS;
}

export function doctorRegistrationExistsError(value: string) {
  return duplicateError(DOCTOR_REGISTRATION_EXISTS, value);
}

export function getDoctorUniqueConstraintErrors(
  error: unknown,
  input: Pick<CreateDoctorInput | UpdateDoctorInput, 'staffCode' | 'registrationNumber'>
): string[] {
  const databaseError = getDatabaseError(error);

  if (databaseError?.code !== '23505') {
    return [];
  }

  if (
    databaseError.constraint === 'doctor_tenant_registration_number_idx' &&
    input.registrationNumber
  ) {
    return [doctorRegistrationExistsError(input.registrationNumber)];
  }

  if (databaseError.constraint === 'staff_profile_tenant_staff_code_idx' && input.staffCode) {
    return [duplicateError(STAFF_CODE_EXISTS, input.staffCode)];
  }

  if (
    databaseError.constraint === 'user_email_unique' ||
    databaseError.constraint === 'staff_profile_user_tenant_idx' ||
    databaseError.constraint === 'staff_profile_user_not_deleted_idx' ||
    databaseError.constraint === 'doctor_user_not_deleted_idx'
  ) {
    return [DOCTOR_EMAIL_EXISTS];
  }

  return [];
}
