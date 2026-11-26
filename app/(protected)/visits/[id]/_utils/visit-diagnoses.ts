import type { VisitDiagnosis } from '@/app/api/lib/modules/visit-diagnosis/schemas/visit-diagnosis-schema';
import type { SaveVisitDiagnosesRequest } from '@/app/api/v1/visits/[id]/diagnoses/types';

export type DiagnosisCodeSystem = VisitDiagnosis['codeSystem'];

/** A diagnosis being edited on the Visit, before it is saved. */
export type DiagnosisDraft = {
  /** The master row's id within its code system. */
  codeId: number;
  codeSystem: DiagnosisCodeSystem;
  code: string;
  title: string;
  englishName: string | null;
  icdMapping: VisitDiagnosis['icdMapping'];
  diagnosisType: VisitDiagnosis['diagnosisType'];
  notes: string;
};

export function draftKey(draft: Pick<DiagnosisDraft, 'codeSystem' | 'codeId'>) {
  return `${draft.codeSystem}-${draft.codeId}`;
}

export function toDiagnosisDrafts(diagnoses: VisitDiagnosis[]): DiagnosisDraft[] {
  return diagnoses.map((diagnosis) => ({
    codeId:
      (diagnosis.codeSystem === 'ICD10CM'
        ? diagnosis.diagnosisCodeId
        : diagnosis.ayurvedaDiagnosisCodeId) ?? 0,
    codeSystem: diagnosis.codeSystem,
    code: diagnosis.code,
    title: diagnosis.title,
    englishName: diagnosis.englishName,
    icdMapping: diagnosis.icdMapping,
    diagnosisType: diagnosis.diagnosisType,
    notes: diagnosis.notes ?? '',
  }));
}

/** A master code chosen in a dropdown, before it is Primary or Secondary. */
export type DiagnosisOption = Omit<DiagnosisDraft, 'diagnosisType' | 'notes'>;

function keepNotes(drafts: DiagnosisDraft[], option: DiagnosisOption) {
  return drafts.find((draft) => draftKey(draft) === draftKey(option))?.notes ?? '';
}

/**
 * Sets the code system's Primary (Principal) diagnosis. A code chosen as Primary leaves
 * the Secondary list; clearing the Primary promotes the first Secondary, because a code
 * system with any diagnoses needs exactly one Principal.
 */
export function setPrimaryDiagnosis(
  drafts: DiagnosisDraft[],
  codeSystem: DiagnosisCodeSystem,
  option: DiagnosisOption | null
): DiagnosisDraft[] {
  const others = drafts.filter((draft) => draft.codeSystem !== codeSystem);
  const secondaries = drafts.filter(
    (draft) =>
      draft.codeSystem === codeSystem &&
      draft.diagnosisType === 'SECONDARY' &&
      (!option || draftKey(draft) !== draftKey(option))
  );

  if (option) {
    const primary: DiagnosisDraft = {
      ...option,
      diagnosisType: 'PRINCIPAL',
      notes: keepNotes(drafts, option),
    };
    return [...others, primary, ...secondaries];
  }

  const [promoted, ...rest] = secondaries;

  return promoted
    ? [...others, { ...promoted, diagnosisType: 'PRINCIPAL' }, ...rest]
    : [...others, ...rest];
}

/** Replaces the code system's Secondary diagnoses, never duplicating the Primary. */
export function setSecondaryDiagnoses(
  drafts: DiagnosisDraft[],
  codeSystem: DiagnosisCodeSystem,
  options: DiagnosisOption[]
): DiagnosisDraft[] {
  const others = drafts.filter((draft) => draft.codeSystem !== codeSystem);
  const primary = drafts.find(
    (draft) => draft.codeSystem === codeSystem && draft.diagnosisType === 'PRINCIPAL'
  );
  const seen = new Set(primary ? [draftKey(primary)] : []);
  const chosen = options.filter((option) => {
    const key = draftKey(option);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const secondaries = chosen.map<DiagnosisDraft>((option, index) => ({
    ...option,
    // Without a Primary the first choice takes the role, as the API requires one.
    diagnosisType: !primary && index === 0 ? 'PRINCIPAL' : 'SECONDARY',
    notes: keepNotes(drafts, option),
  }));

  return [...others, ...(primary ? [primary] : []), ...secondaries];
}

/** Whether two lists would save the same diagnoses, so choosing and then undoing is not a change. */
export function sameDiagnoses(a: DiagnosisDraft[], b: DiagnosisDraft[]) {
  return (
    JSON.stringify(toSaveVisitDiagnosesRequest(a)) ===
    JSON.stringify(toSaveVisitDiagnosesRequest(b))
  );
}

/** Principal first within each code system, so the saved order reads like a claim. */
export function toSaveVisitDiagnosesRequest(drafts: DiagnosisDraft[]): SaveVisitDiagnosesRequest {
  const ordered = [...drafts].sort(
    (a, b) =>
      a.codeSystem.localeCompare(b.codeSystem) ||
      Number(b.diagnosisType === 'PRINCIPAL') - Number(a.diagnosisType === 'PRINCIPAL')
  );

  return {
    diagnoses: ordered.map((draft) => ({
      codeSystem: draft.codeSystem,
      diagnosisType: draft.diagnosisType,
      notes: draft.notes.trim() || null,
      ...(draft.codeSystem === 'ICD10CM'
        ? { diagnosisCodeId: draft.codeId }
        : { ayurvedaDiagnosisCodeId: draft.codeId }),
    })),
  };
}
