import type { ValidationResult } from '@/app/api/lib/utils/types';
import { staffRepository } from '../repository/staff-repository';

const CONFLICT_STATUS = 409;
const STAFF_EMAIL_EXISTS = 'A user with this email already exists.';
const STAFF_CODE_EXISTS = "Staff code '{value}' already exists.";

type StaffUniquenessInput = {
  tenantId: string;
  email?: string;
  staffCode?: string | null;
  excludeUserId?: string;
};

function duplicateError(template: string, value: string) {
  return template.replace('{value}', value);
}

export async function validateStaffUniqueness({
  tenantId,
  email,
  staffCode,
  excludeUserId,
}: StaffUniquenessInput): Promise<ValidationResult<void>> {
  const [existingUser, existingStaffCode] = await Promise.all([
    email ? staffRepository.findUserByEmail(email) : undefined,
    staffCode
      ? staffRepository.findNonDeletedByStaffCode(tenantId, staffCode, { excludeUserId })
      : undefined,
  ]);

  const errors: string[] = [];

  if (existingUser) {
    errors.push(STAFF_EMAIL_EXISTS);
  }

  if (existingStaffCode && staffCode) {
    errors.push(duplicateError(STAFF_CODE_EXISTS, staffCode));
  }

  if (errors.length > 0) {
    return { success: false, errors, status: CONFLICT_STATUS };
  }

  return { success: true, data: undefined };
}

export function getStaffUniqueConstraintErrors(
  error: unknown,
  input: Pick<StaffUniquenessInput, 'email' | 'staffCode'>
): string[] {
  if (typeof error !== 'object' || error === null) {
    return [];
  }

  const err = error as Record<string, unknown>;

  if (err.code !== '23505') {
    return [];
  }

  if (err.constraint === 'user_email_unique') {
    return [STAFF_EMAIL_EXISTS];
  }

  if (err.constraint === 'staff_profile_tenant_staff_code_idx' && input.staffCode) {
    return [duplicateError(STAFF_CODE_EXISTS, input.staffCode)];
  }

  if (
    err.constraint === 'staff_profile_user_tenant_idx' ||
    err.constraint === 'staff_profile_user_not_deleted_idx'
  ) {
    return [STAFF_EMAIL_EXISTS];
  }

  return [];
}
