import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantLocalDateTime } from '../../appointment/schemas/appointment-slot';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitRepository } from '../repository/visit-repository';
import { formatVisitDate } from '../schemas/visit-schema';
import {
  threeYearLookbackStart,
  type VisitPatientTypeAssessment,
} from '../schemas/visit-patient-type';
import { validateGetVisitPatientType } from '../validator/get-visit-patient-type-validator';

export async function getVisitPatientTypeQuery(
  patientId: unknown,
  tenantId: string
): Promise<SingleQueryResult<VisitPatientTypeAssessment>> {
  const validation = await validateGetVisitPatientType(patientId, tenantId);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
      status:
        validation.errors[0] === 'Patient not found.'
          ? StatusCodes.NOT_FOUND
          : StatusCodes.BAD_REQUEST,
    };
  }

  const tenant = await tenantRepository.getTenantById(tenantId);
  if (!tenant) {
    return { success: false, errors: ['Tenant not found.'], status: StatusCodes.NOT_FOUND };
  }

  const today = tenantLocalDateTime(new Date(), tenant.timeZone).date;
  const patientRecordDate = tenantLocalDateTime(validation.data.createdOn, tenant.timeZone).date;
  const lookbackStartDate = threeYearLookbackStart(today);
  const fromDate = patientRecordDate > lookbackStartDate ? patientRecordDate : lookbackStartDate;
  const lastVisit = await visitRepository.findLatestCompletedVisitForPatient(
    tenantId,
    validation.data.id,
    fromDate,
    today
  );

  return {
    success: true,
    data: {
      patientType: lastVisit ? 'ESTABLISHED' : 'NEW',
      patientRecordDate,
      lookbackStartDate,
      lastCompletedVisit: lastVisit
        ? { visitNumber: lastVisit.visitNumber, visitDate: formatVisitDate(lastVisit.visitDate) }
        : null,
    },
  };
}
