import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionTypeRepository } from '../../admission-type/repository/admission-type-repository';
import { bedRepository } from '../../bed/repository/bed-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { visitRepository } from '../../visit/repository/visit-repository';
import { admissionRepository } from '../repository/admission-repository';
import {
  admissionTenantIdSchema,
  admitPatientSchema,
  type ValidatedAdmitPatientData,
} from '../schemas/admission-schema';

// Only these Bed states mean "ready for an incoming Patient" — a reservation
// exists to be used (ADR 0033).
const ADMITTABLE_BED_STATUSES = ['AVAILABLE', 'RESERVED'];

export async function validateAdmitPatient(
  payload: unknown,
  tenantId: unknown
): Promise<ValidationResult<ValidatedAdmitPatientData>> {
  const tenantIdResult = admissionTenantIdSchema.safeParse(tenantId);
  const payloadResult = admitPatientSchema.safeParse(payload);

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

  const [admissionType, bed, doctor, patient] = await Promise.all([
    admissionTypeRepository.getAdmissionTypeById(data.admissionTypeId, validatedTenantId),
    bedRepository.getBedById(data.bedId, validatedTenantId),
    doctorRepository.getDoctorById(data.doctorId, validatedTenantId),
    patientRepository.getPatientById(data.patientId, validatedTenantId),
  ]);

  if (!admissionType) {
    return {
      success: false,
      errors: [`Admission type ${data.admissionTypeId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!bed) {
    return {
      success: false,
      errors: [`Bed ${data.bedId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!ADMITTABLE_BED_STATUSES.includes(bed.status)) {
    return {
      success: false,
      errors: [`Bed ${bed.bedNumber} is not available for admission.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!doctor) {
    return {
      success: false,
      errors: [`Doctor ${data.doctorId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!doctor.isActive) {
    return {
      success: false,
      errors: [`Doctor ${data.doctorId} is inactive and cannot be assigned an Admission.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!patient) {
    return {
      success: false,
      errors: [`Patient ${data.patientId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  // Only Registered Patients may begin clinical care (glossary).
  if (patient.registrationStatus !== 'registered') {
    return {
      success: false,
      errors: [
        `Patient ${data.patientId} is provisional and must complete registration before admission.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!patient.isActive) {
    return {
      success: false,
      errors: [`Patient ${data.patientId} is inactive and cannot be admitted.`],
      status: StatusCodes.CONFLICT,
    };
  }

  if (data.visitId !== undefined) {
    const visit = await visitRepository.getVisitForClinicalCapture(validatedTenantId, data.visitId);

    if (!visit) {
      return {
        success: false,
        errors: [`Visit ${data.visitId} is Invalid.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (visit.patientId !== data.patientId) {
      return {
        success: false,
        errors: [`Visit ${data.visitId} does not belong to patient ${data.patientId}.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (visit.status === 'CANCELLED') {
      return {
        success: false,
        errors: [`Visit ${data.visitId} is cancelled.`],
        status: StatusCodes.CONFLICT,
      };
    }
  }

  const activeAdmission = await admissionRepository.findActiveAdmissionByPatientId(
    validatedTenantId,
    data.patientId
  );

  if (activeAdmission) {
    return {
      success: false,
      errors: [`Patient ${data.patientId} already has an active admission.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: {
      tenantId: validatedTenantId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      admissionTypeId: data.admissionTypeId,
      bedId: data.bedId,
      bedNumber: bed.bedNumber,
      visitId: data.visitId,
      remarks: data.remarks,
      admissionReason: data.admissionReason,
      expectedDischargeDate: data.expectedDischargeDate,
    },
  };
}
