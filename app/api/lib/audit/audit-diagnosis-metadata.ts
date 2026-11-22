import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';

// Diagnoses are a list, so their Audit Event records which codes were added and
// removed by a save or amend, rather than a field-by-field before/after.
export function diagnosisAuditMetadata(before: VisitDiagnosis[], after: VisitDiagnosis[]) {
  const beforeCodes = new Set(before.map(({ code }) => code));
  const afterCodes = new Set(after.map(({ code }) => code));

  return {
    added: [...afterCodes].filter((code) => !beforeCodes.has(code)),
    removed: [...beforeCodes].filter((code) => !afterCodes.has(code)),
  };
}
