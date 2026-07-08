import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { specialtyRepository } from '../../specialty/repository/specialty-repository';
import { staffRepository } from '../../staff/repository/staff-repository';
import { doctorRepository } from '../repository/doctor-repository';
import { createDoctorSchema, type CreateDoctorInput } from '../schemas/doctor-schema';
import {
  doctorEmailExistsError,
  doctorRegistrationExistsError,
} from './doctor-uniqueness-validator';

export async function validateCreateDoctor(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateDoctorInput>> {
  const result = createDoctorSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const [specialty, existingRegistration, existingUser, existingStaffCode] = await Promise.all([
    specialtyRepository.getSpecialtyById(result.data.specialtyId, tenantId),
    result.data.registrationNumber
      ? doctorRepository.findActiveByRegistrationNumber(tenantId, result.data.registrationNumber)
      : undefined,
    staffRepository.findUserByEmail(result.data.email),
    result.data.staffCode
      ? staffRepository.findNonDeletedByStaffCode(tenantId, result.data.staffCode)
      : undefined,
  ]);
  const errors: string[] = [];
  let status: StatusCodes | undefined;

  if (!specialty) {
    errors.push(`Specialty ${result.data.specialtyId} is Invalid.`);
  }

  if (existingRegistration && result.data.registrationNumber) {
    errors.push(doctorRegistrationExistsError(result.data.registrationNumber));
    status = StatusCodes.CONFLICT;
  }

  if (existingUser) {
    errors.push(doctorEmailExistsError());
    status = StatusCodes.CONFLICT;
  }

  if (existingStaffCode && result.data.staffCode) {
    errors.push(`Staff code '${result.data.staffCode}' already exists.`);
    status = StatusCodes.CONFLICT;
  }

  if (errors.length > 0) {
    return { success: false, errors, status };
  }

  return { success: true, data: result.data };
}
