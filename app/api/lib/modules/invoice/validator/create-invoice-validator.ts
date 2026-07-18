import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admissionRepository } from '@/app/api/lib/modules/admission/repository/admission-repository';
import { patientRepository } from '@/app/api/lib/modules/patient/repository/patient-repository';
import { visitRepository } from '@/app/api/lib/modules/visit/repository/visit-repository';
import { createInvoiceSchema, type CreateInvoiceInput } from '../schemas/invoice-schema';

export async function validateCreateInvoice(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateInvoiceInput>> {
  const result = createInvoiceSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const { patientId, visitId, admissionId } = result.data;

  const patient = await patientRepository.getPatientById(patientId, tenantId);

  if (!patient) {
    return {
      success: false,
      errors: [`Patient ${patientId} is Invalid.`],
      status: StatusCodes.NOT_FOUND,
    };
  }

  if (visitId !== undefined) {
    const visit = await visitRepository.getVisitById(visitId, tenantId);

    if (!visit) {
      return {
        success: false,
        errors: [`Visit ${visitId} is Invalid.`],
        status: StatusCodes.NOT_FOUND,
      };
    }

    if (visit.patient.id !== patientId) {
      return {
        success: false,
        errors: [`Visit ${visit.visitNumber} does not belong to patient ${patient.mrn}.`],
        status: StatusCodes.CONFLICT,
      };
    }
  }

  if (admissionId !== undefined) {
    const admission = await admissionRepository.getAdmissionById(admissionId, tenantId);

    if (!admission) {
      return {
        success: false,
        errors: [`Admission ${admissionId} is Invalid.`],
        status: StatusCodes.NOT_FOUND,
      };
    }

    if (admission.patient.id !== patientId) {
      return {
        success: false,
        errors: [
          `Admission ${admission.admissionNumber} does not belong to patient ${patient.mrn}.`,
        ],
        status: StatusCodes.CONFLICT,
      };
    }
  }

  return { success: true, data: result.data };
}
