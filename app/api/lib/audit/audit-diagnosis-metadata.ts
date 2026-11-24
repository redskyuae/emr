import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';

type DiagnosisDetails = { type: VisitDiagnosis['diagnosisType']; notes: string | null };

// Diagnoses are a list, so their Audit Event records which codes were added and
// removed by a save or amend, rather than a field-by-field before/after. A code
// kept on both sides whose type (Principal/Secondary) or notes changed is listed
// under `changed` with its before and after; `changed` is left out when empty.
export function diagnosisAuditMetadata(before: VisitDiagnosis[], after: VisitDiagnosis[]) {
  const beforeByCode = new Map(before.map((diagnosis) => [diagnosis.code, diagnosis]));
  const afterCodes = new Set(after.map(({ code }) => code));
  const details = ({ diagnosisType, notes }: VisitDiagnosis): DiagnosisDetails => ({
    type: diagnosisType,
    notes,
  });

  const changed = after.flatMap((next) => {
    const previous = beforeByCode.get(next.code);

    if (!previous) return [];

    return previous.diagnosisType !== next.diagnosisType || previous.notes !== next.notes
      ? [{ code: next.code, from: details(previous), to: details(next) }]
      : [];
  });

  return {
    added: [...afterCodes].filter((code) => !beforeByCode.has(code)),
    removed: [...beforeByCode.keys()].filter((code) => !afterCodes.has(code)),
    ...(changed.length ? { changed } : {}),
  };
}
