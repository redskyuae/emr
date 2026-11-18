import { StatusCodes } from 'http-status-codes';

import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitDiagnosisRepository } from '../repository/visit-diagnosis-repository';
import {
  saveVisitDiagnosesSchema,
  visitDiagnosisVisitIdSchema,
  type VisitDiagnosisEntry,
} from '../schemas/visit-diagnosis-schema';

type VisitDiagnosesPayload = {
  visitId: number;
  diagnoses: VisitDiagnosisEntry[];
};

// Shared by the active-Visit save and the Completed-Visit amend paths.
export function parseVisitDiagnosesPayload(
  visitId: unknown,
  payload: unknown
): ValidationResult<VisitDiagnosesPayload> {
  const visitIdResult = visitDiagnosisVisitIdSchema.safeParse(visitId);
  const payloadResult = saveVisitDiagnosesSchema.safeParse(payload);

  if (!visitIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!visitIdResult.success) {
      errors.push(`Visit ${String(visitId)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  return {
    success: true,
    data: { visitId: visitIdResult.data, diagnoses: payloadResult.data.diagnoses },
  };
}

function uniqueIds(ids: (number | null)[]) {
  return [...new Set(ids.filter((id): id is number => id !== null))];
}

/**
 * Every referenced master row must exist in the Tenant and be active, except a
 * code this Visit already records: it is kept as-is so a Visit whose code was
 * later deleted can still be amended. A code may appear only once per system.
 */
export async function validateVisitDiagnosisReferences(
  tenantId: string,
  visitId: number,
  diagnoses: VisitDiagnosisEntry[]
): Promise<ValidationResult<void>> {
  const icdIds = uniqueIds(diagnoses.map(({ diagnosisCodeId }) => diagnosisCodeId));
  const ayurvedaIds = uniqueIds(
    diagnoses.map(({ ayurvedaDiagnosisCodeId }) => ayurvedaDiagnosisCodeId)
  );

  const [recorded, icdReferences, ayurvedaReferences] = await Promise.all([
    visitDiagnosisRepository.listByVisit(tenantId, visitId),
    visitDiagnosisRepository.getDiagnosisCodeReferences(tenantId, icdIds),
    visitDiagnosisRepository.getAyurvedaDiagnosisCodeReferences(tenantId, ayurvedaIds),
  ]);
  const recordedIcdIds = new Set(recorded.map(({ diagnosisCodeId }) => diagnosisCodeId));
  const recordedAyurvedaIds = new Set(
    recorded.map(({ ayurvedaDiagnosisCodeId }) => ayurvedaDiagnosisCodeId)
  );
  const icdById = new Map(icdReferences.map((reference) => [reference.id, reference]));
  const ayurvedaById = new Map(ayurvedaReferences.map((reference) => [reference.id, reference]));

  const invalidErrors = [
    ...icdIds
      .filter((id) => {
        const reference = icdById.get(id);
        return !reference || (reference.isDeleted && !recordedIcdIds.has(id));
      })
      .map((id) => `Diagnosis code ${id} is Invalid.`),
    ...ayurvedaIds
      .filter((id) => {
        const reference = ayurvedaById.get(id);
        return !reference || (reference.isDeleted && !recordedAyurvedaIds.has(id));
      })
      .map((id) => `Ayurveda diagnosis code ${id} is Invalid.`),
  ];

  if (invalidErrors.length > 0) {
    return { success: false, errors: invalidErrors, status: StatusCodes.CONFLICT };
  }

  const seen = new Set<string>();
  const duplicateErrors = new Set<string>();

  for (const diagnosis of diagnoses) {
    const reference =
      diagnosis.codeSystem === 'ICD10CM'
        ? icdById.get(diagnosis.diagnosisCodeId ?? 0)
        : ayurvedaById.get(diagnosis.ayurvedaDiagnosisCodeId ?? 0);
    const code = reference?.code.toUpperCase() ?? '';
    const key = `${diagnosis.codeSystem}:${code}`;

    if (seen.has(key)) {
      duplicateErrors.add(`Diagnosis code ${code} is listed more than once.`);
    }

    seen.add(key);
  }

  if (duplicateErrors.size > 0) {
    return { success: false, errors: [...duplicateErrors] };
  }

  return { success: true, data: undefined };
}

// The Visit row lock serialises saves, so this only fires if two saves still race.
export function getVisitDiagnosisConstraintErrors(error: unknown): string[] {
  const dbError = getDatabaseError(error);

  if (
    dbError?.code === '23505' &&
    dbError.constraint === 'visit_diagnosis_tenant_visit_principal_idx'
  ) {
    return ['Visit diagnoses were changed by another save. Reload and try again.'];
  }

  return [];
}
