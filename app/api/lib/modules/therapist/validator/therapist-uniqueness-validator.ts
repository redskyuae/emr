import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { therapistRepository } from '../repository/therapist-repository';

export async function validateTherapistRegistrationUniqueness(
  tenantId: string,
  registrationNumber: string | undefined,
  excludeId?: number
): Promise<ValidationResult<void>> {
  if (!registrationNumber) return { success: true, data: undefined };
  const existing = await therapistRepository.findActiveByRegistrationNumber(
    tenantId,
    registrationNumber,
    { excludeId }
  );
  return existing
    ? {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: [`Therapist registration number ${registrationNumber} already exists.`],
      }
    : { success: true, data: undefined };
}

export function getTherapistUniqueConstraintErrors(error: unknown, registrationNumber?: string) {
  if (
    typeof error !== 'object' ||
    error === null ||
    (error as { code?: string }).code !== '23505' ||
    !registrationNumber
  ) {
    return [];
  }
  return (error as { constraint?: string }).constraint ===
    'therapist_tenant_registration_number_idx'
    ? [`Therapist registration number ${registrationNumber} already exists.`]
    : [];
}
