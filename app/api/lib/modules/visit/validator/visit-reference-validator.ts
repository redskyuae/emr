import { StatusCodes } from 'http-status-codes';

import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import type { ValidationResult } from '@/app/api/lib/utils/types';

type VisitReferenceInput = {
  patientId?: number;
  doctorId?: number;
  appointmentTypeId: number;
  appointmentReasonId?: number;
};

export async function validateVisitReferences(
  tenantId: string,
  input: VisitReferenceInput
): Promise<ValidationResult<void>> {
  const [patient, doctor, appointmentType, appointmentReason] = await Promise.all([
    input.patientId ? patientRepository.getPatientById(input.patientId, tenantId) : undefined,
    input.doctorId ? doctorRepository.getDoctorById(input.doctorId, tenantId) : undefined,
    appointmentTypeRepository.getAppointmentTypeById(input.appointmentTypeId, tenantId),
    input.appointmentReasonId
      ? appointmentReasonRepository.getAppointmentReasonById(input.appointmentReasonId, tenantId)
      : undefined,
  ]);

  const errors: string[] = [];

  if (input.patientId && !patient) {
    errors.push(`Visit patient ${input.patientId} is Invalid.`);
  }

  if (input.patientId && patient && !patient.isActive) {
    errors.push('Visit patient is Inactive and cannot be selected for a new Visit.');
  }

  if (input.doctorId && !doctor) {
    errors.push(`Visit doctor ${input.doctorId} is Invalid.`);
  }

  if (input.doctorId && doctor && !doctor.isActive) {
    errors.push('Visit doctor is Inactive and cannot be assigned to a Visit.');
  }

  if (!appointmentType) {
    errors.push(`Visit appointment type ${input.appointmentTypeId} is Invalid.`);
  }

  if (input.appointmentReasonId && !appointmentReason) {
    errors.push(`Visit appointment reason ${input.appointmentReasonId} is Invalid.`);
  }

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: undefined };
}
