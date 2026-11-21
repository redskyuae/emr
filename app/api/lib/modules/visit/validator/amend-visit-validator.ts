import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { admitSourceRepository } from '../../admit-source/repository/admit-source-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import { visitTypeRepository } from '../../visit-type/repository/visit-type-repository';
import { visitTypeRequiresDoctor } from '../visit-doctor-requirement';
import {
  amendVisitSchema,
  visitIdSchema,
  type AmendVisitInput,
  type Visit,
} from '../schemas/visit-schema';
import { validateVisitForAmendment } from './visit-amendment-validator';

type AmendVisitParams = {
  id: number;
  payload: AmendVisitInput;
};

// A reference the Visit already holds is kept as-is: a Completed Visit may point
// at a Doctor, VisitType, Admit Source or Treatment that has since been
// deactivated or deleted, and amending another field must not force it to change.
async function validateDoctor(
  doctorId: number | null,
  visit: Visit,
  tenantId: string
): Promise<string | undefined> {
  if (doctorId === null || doctorId === visit.doctor?.id) {
    return undefined;
  }

  const doctor = await doctorRepository.getDoctorById(doctorId, tenantId);

  if (!doctor) {
    return `Doctor ${doctorId} is Invalid.`;
  }

  if (!doctor.isActive) {
    return `Doctor ${doctorId} is inactive and cannot be assigned a Visit.`;
  }

  return undefined;
}

// Resolves the amended Visit Type so the Doctor rule can read its code.
async function validateVisitType(
  visitTypeId: number,
  visit: Visit,
  tenantId: string
): Promise<{ error?: string; code?: string }> {
  if (visitTypeId === visit.visitType.id) {
    return { code: visit.visitType.code };
  }

  const visitType = await visitTypeRepository.getVisitTypeById(visitTypeId, tenantId);

  return visitType ? { code: visitType.code } : { error: `Visit type ${visitTypeId} is Invalid.` };
}

async function validateAdmitSource(admitSourceId: number | null, visit: Visit, tenantId: string) {
  if (admitSourceId === null || admitSourceId === visit.admitSource?.id) {
    return undefined;
  }

  const admitSource = await admitSourceRepository.getAdmitSourceById(admitSourceId, tenantId);

  return admitSource ? undefined : `Admit source ${admitSourceId} is Invalid.`;
}

async function validateTreatment(payload: AmendVisitInput, visit: Visit, tenantId: string) {
  const { treatmentId, treatmentSessionId } = payload;

  if (treatmentId === null || treatmentSessionId === null) {
    return [];
  }

  if (treatmentId === visit.treatment?.id && treatmentSessionId === visit.treatmentSession?.id) {
    return [];
  }

  const [treatment, treatmentSession] = await Promise.all([
    treatmentRepository.getTreatmentById(treatmentId, tenantId),
    treatmentRepository.getTreatmentSessionById(treatmentSessionId, tenantId),
  ]);
  const errors: string[] = [];

  if (!treatment) {
    errors.push(`Treatment ${treatmentId} is Invalid.`);
  }

  if (!treatmentSession) {
    errors.push(`Treatment session ${treatmentSessionId} is Invalid.`);
  } else if (treatmentSession.treatmentId !== treatmentId) {
    errors.push('Treatment session does not belong to the selected Treatment.');
  }

  return errors;
}

export async function validateAmendVisit(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<AmendVisitParams>> {
  const idResult = visitIdSchema.safeParse(id);
  const payloadResult = amendVisitSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const visitResult = await validateVisitForAmendment(idResult.data, tenantId);

  if (!visitResult.success) {
    return visitResult;
  }

  const visit = visitResult.data;
  const data = payloadResult.data;

  const [doctorError, visitType, admitSourceError, treatmentErrors] = await Promise.all([
    validateDoctor(data.doctorId, visit, tenantId),
    validateVisitType(data.visitTypeId, visit, tenantId),
    validateAdmitSource(data.admitSourceId, visit, tenantId),
    validateTreatment(data, visit, tenantId),
  ]);
  const doctorRequiredError =
    data.doctorId === null && visitTypeRequiresDoctor(visitType.code)
      ? 'Doctor ID is required for an OPD Consultation Visit'
      : undefined;
  const errors = [
    doctorError,
    doctorRequiredError,
    visitType.error,
    admitSourceError,
    ...treatmentErrors,
  ].filter((error): error is string => error !== undefined);

  if (errors.length > 0) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  return { success: true, data: { id: idResult.data, payload: data } };
}
