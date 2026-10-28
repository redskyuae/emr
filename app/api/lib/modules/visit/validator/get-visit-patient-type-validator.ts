import { z } from 'zod';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../../patient/repository/patient-repository';
import type { Patient } from '../../patient/schemas/patient-schema';

const patientIdSchema = z.coerce.number().int().positive();

export async function validateGetVisitPatientType(
  patientId: unknown,
  tenantId: string
): Promise<ValidationResult<Patient>> {
  const parsed = patientIdSchema.safeParse(patientId);
  if (!parsed.success) {
    return { success: false, errors: ['Patient ID must be a positive integer.'] };
  }
  const patient = await patientRepository.getPatientById(parsed.data, tenantId);
  if (!patient) {
    return { success: false, errors: ['Patient not found.'] };
  }
  return { success: true, data: patient };
}
