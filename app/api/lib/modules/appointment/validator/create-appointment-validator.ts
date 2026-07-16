import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentModeRepository } from '../../appointment-mode/repository/appointment-mode-repository';
import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { validatePatientGovtIdUniqueness } from '../../patient/validator/patient-govt-id-validator';
import { validatePatientReferences } from '../../patient/validator/patient-reference-validator';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import {
  appointmentTenantIdSchema,
  createAppointmentSchema,
  type PotentialPatientMatch,
  type ValidatedCreateAppointmentData,
} from '../schemas/appointment-schema';
import { isFutureSlotSelection, isValidSlotSelection } from '../schemas/appointment-slot';

export type CreateAppointmentValidationResult = ValidationResult<ValidatedCreateAppointmentData> & {
  patientMatches?: PotentialPatientMatch[];
};

export async function validateCreateAppointment(
  payload: unknown,
  tenantId: unknown
): Promise<CreateAppointmentValidationResult> {
  const tenantIdResult = appointmentTenantIdSchema.safeParse(tenantId);
  const payloadResult = createAppointmentSchema.safeParse(payload);

  if (!tenantIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const data = payloadResult.data;
  const validatedTenantId = tenantIdResult.data;
  const [tenant, mode, type, reason, scheduledStatus, slotContext] = await Promise.all([
    tenantRepository.getTenantById(validatedTenantId),
    appointmentModeRepository.getAppointmentModeById(data.appointmentModeId, validatedTenantId),
    appointmentTypeRepository.getAppointmentTypeById(data.appointmentTypeId, validatedTenantId),
    appointmentReasonRepository.getAppointmentReasonById(
      data.appointmentReasonId,
      validatedTenantId
    ),
    appointmentStatusRepository.findSystemByCategory(validatedTenantId, 'SCHEDULED'),
    appointmentRepository.getSlotBookingContext(
      validatedTenantId,
      data.doctorId,
      data.doctorRotaId,
      data.slotDate
    ),
  ]);
  const errors: string[] = [];

  if (!tenant) errors.push('Tenant not found');
  if (!mode) errors.push(`Appointment mode ${data.appointmentModeId} is Invalid.`);
  if (!type) errors.push(`Appointment type ${data.appointmentTypeId} is Invalid.`);
  if (!reason) errors.push(`Appointment reason ${data.appointmentReasonId} is Invalid.`);
  if (!scheduledStatus) errors.push('Scheduled appointment status is not configured.');
  if (!slotContext) errors.push('Doctor slot is Invalid.');

  if (errors.length > 0 || !tenant || !slotContext) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  if (!isValidSlotSelection(slotContext, data.slotTimes)) {
    return {
      success: false,
      errors: ['Selected Doctor slots must exist and be consecutive.'],
    };
  }

  if (!isFutureSlotSelection(data.slotDate, data.slotTimes[0], tenant.timeZone)) {
    return { success: false, errors: ['Selected Doctor slots must be in the future.'] };
  }

  const reserved = await appointmentRepository.getReservedSlotTimes(
    validatedTenantId,
    data.doctorId,
    data.slotDate,
    data.slotTimes
  );

  if (reserved.length > 0) {
    return {
      success: false,
      errors: ['One or more selected Doctor slots are no longer available.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (data.patientId !== undefined) {
    const patient = await patientRepository.getPatientById(data.patientId, validatedTenantId);

    if (!patient) {
      return {
        success: false,
        errors: [`Patient ${data.patientId} is Invalid.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (!patient.isActive) {
      return {
        success: false,
        errors: ['Inactive Patient cannot be booked for an Appointment.'],
        status: StatusCodes.CONFLICT,
      };
    }
  }

  if (data.provisionalPatient) {
    const [referenceResult, govtIdResult, patientMatches] = await Promise.all([
      validatePatientReferences(data.provisionalPatient),
      validatePatientGovtIdUniqueness({
        tenantId: validatedTenantId,
        govtIdType: data.provisionalPatient.govtIdType,
        govtIdNumber: data.provisionalPatient.govtIdNumber,
      }),
      appointmentRepository.findPotentialPatientMatches(
        validatedTenantId,
        data.provisionalPatient.firstName,
        data.provisionalPatient.lastName,
        data.provisionalPatient.phone
      ),
    ]);

    if (!referenceResult.success) {
      return {
        success: false,
        errors: referenceResult.errors,
        status: referenceResult.status,
      };
    }

    if (!govtIdResult.success) {
      return { success: false, errors: govtIdResult.errors, status: govtIdResult.status };
    }

    if (patientMatches.length > 0) {
      return {
        success: false,
        errors: ['Potential Patient match found. Retry with patientId.'],
        status: StatusCodes.CONFLICT,
        patientMatches,
      };
    }
  }

  return {
    success: true,
    data: {
      ...data,
      tenantId: validatedTenantId,
      timeZone: tenant.timeZone,
    },
  };
}
