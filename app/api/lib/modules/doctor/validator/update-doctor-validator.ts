import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { specialtyRepository } from '../../specialty/repository/specialty-repository';
import { staffRepository } from '../../staff/repository/staff-repository';
import { doctorRepository } from '../repository/doctor-repository';
import {
  doctorIdSchema,
  updateDoctorSchema,
  type UpdateDoctorInput,
} from '../schemas/doctor-schema';
import { doctorRegistrationExistsError } from './doctor-uniqueness-validator';

export type UpdateDoctorParams = {
  id: number;
  userId: string;
  payload: UpdateDoctorInput;
};

function getForbiddenCredentialUpdateErrors(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  const errors: string[] = [];

  if ('email' in payload) {
    errors.push('Email cannot be changed through this endpoint.');
  }

  if ('password' in payload) {
    errors.push('Password cannot be changed through this endpoint.');
  }

  return errors;
}

function omitForbiddenCredentialFields(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const allowedPayload = { ...(payload as Record<string, unknown>) };
  delete allowedPayload.email;
  delete allowedPayload.password;

  return allowedPayload;
}

export async function validateUpdateDoctor(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<ValidationResult<UpdateDoctorParams>> {
  const idResult = doctorIdSchema.safeParse(id);
  const forbiddenErrors = getForbiddenCredentialUpdateErrors(payload);
  const payloadResult = updateDoctorSchema.safeParse(omitForbiddenCredentialFields(payload));

  if (!idResult.success || forbiddenErrors.length > 0 || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Doctor ${String(id)} is Invalid.`);
    }

    errors.push(...forbiddenErrors);

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingDoctor = await doctorRepository.getDoctorById(idResult.data, tenantId);

  if (!existingDoctor) {
    return { success: false, errors: ['Doctor not found'], status: StatusCodes.NOT_FOUND };
  }

  const [specialty, existingRegistration, existingStaffCode] = await Promise.all([
    payloadResult.data.specialtyId === undefined
      ? undefined
      : specialtyRepository.getSpecialtyById(payloadResult.data.specialtyId, tenantId),
    payloadResult.data.registrationNumber
      ? doctorRepository.findActiveByRegistrationNumber(
          tenantId,
          payloadResult.data.registrationNumber,
          { excludeId: idResult.data }
        )
      : undefined,
    payloadResult.data.staffCode
      ? staffRepository.findNonDeletedByStaffCode(tenantId, payloadResult.data.staffCode, {
          excludeUserId: existingDoctor.userId,
        })
      : undefined,
  ]);
  const errors: string[] = [];
  let status: StatusCodes | undefined;

  if (payloadResult.data.specialtyId !== undefined && !specialty) {
    errors.push(`Specialty ${payloadResult.data.specialtyId} is Invalid.`);
  }

  if (existingRegistration && payloadResult.data.registrationNumber) {
    errors.push(doctorRegistrationExistsError(payloadResult.data.registrationNumber));
    status = StatusCodes.CONFLICT;
  }

  if (existingStaffCode && payloadResult.data.staffCode) {
    errors.push(`Staff code '${payloadResult.data.staffCode}' already exists.`);
    status = StatusCodes.CONFLICT;
  }

  if (errors.length > 0) {
    return { success: false, errors, status };
  }

  return {
    success: true,
    data: {
      id: idResult.data,
      userId: existingDoctor.userId,
      payload: payloadResult.data,
    },
  };
}
