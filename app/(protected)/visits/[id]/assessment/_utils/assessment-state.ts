import type {
  ClinicalFinding,
  DiagnosisRow,
  FindingStatus,
  PrescriptionRow,
  ProcedureRow,
  StaticAssessment,
  StaticClinicianVisit,
  TreatmentRow,
  VisitStatus,
} from '../../../_data/static-clinician-visits';

export type EditableTextField =
  | 'chiefComplaint'
  | 'hpi'
  | 'clinicalImpression'
  | 'advisedTreatment'
  | 'addendum'
  | 'presentingComplaint'
  | 'examinationFinding'
  | 'recommendation'
  | 'encounterEnd'
  | 'dischargeDisposition';

export type AssessmentState = StaticAssessment & {
  status: VisitStatus;
  completedAt?: string;
  lastSavedAt?: string;
  nextRowSequence: number;
};

export type AssessmentAction =
  | { type: 'update-field'; field: EditableTextField; value: string }
  | { type: 'update-finding'; target: 'ros' | 'exam'; id: string; status: FindingStatus }
  | { type: 'mark-all-normal'; target: 'ros' | 'exam' }
  | { type: 'add-diagnosis' }
  | { type: 'remove-diagnosis'; id: string }
  | { type: 'add-treatment' }
  | { type: 'remove-treatment'; id: string }
  | { type: 'add-procedure' }
  | { type: 'remove-procedure'; id: string }
  | { type: 'add-prescription' }
  | { type: 'remove-prescription'; id: string }
  | { type: 'save-draft'; savedAt: string }
  | { type: 'complete-visit'; completedAt: string };

export function createAssessmentState(visit: StaticClinicianVisit): AssessmentState {
  return {
    ...structuredClone(visit.assessment),
    status: visit.status,
    completedAt: visit.completedAt,
    nextRowSequence: 10,
  };
}

function updateFinding(
  findings: ClinicalFinding[],
  id: string,
  status: FindingStatus
): ClinicalFinding[] {
  return findings.map((finding) =>
    finding.id === id
      ? {
          ...finding,
          status,
          remarks:
            status === 'abnormal' ? finding.remarks || 'Abnormal finding noted.' : finding.remarks,
        }
      : finding
  );
}

function newDiagnosis(id: string): DiagnosisRow {
  return {
    id,
    code: '',
    description: 'New diagnosis',
    type: 'Working',
    reasonForVisit: false,
    onsetYear: '',
    narrative: '',
    primary: false,
  };
}

function newTreatment(id: string): TreatmentRow {
  return { id, service: 'New treatment', sessions: '1', summary: '', status: 'Pending' };
}

function newProcedure(id: string): ProcedureRow {
  return { id, code: '', description: 'New procedure', quantity: '1', notes: '' };
}

function newPrescription(id: string): PrescriptionRow {
  return {
    id,
    medicine: 'New medicine',
    unit: 'Tablet',
    route: 'Oral',
    dose: '1',
    frequency: 'Once daily',
    duration: '5 days',
    refill: '0',
    quantity: '5',
    startDate: '',
    endDate: '',
    instruction: '',
  };
}

function appendRow<T>(state: AssessmentState, key: string, create: (id: string) => T) {
  const id = `${key}-${state.nextRowSequence}`;
  return { row: create(id), nextRowSequence: state.nextRowSequence + 1 };
}

export function assessmentReducer(
  state: AssessmentState,
  action: AssessmentAction
): AssessmentState {
  switch (action.type) {
    case 'update-field':
      return { ...state, [action.field]: action.value };
    case 'update-finding':
      return {
        ...state,
        [action.target]: updateFinding(state[action.target], action.id, action.status),
      };
    case 'mark-all-normal':
      return {
        ...state,
        [action.target]: state[action.target].map((finding) => ({
          ...finding,
          status: 'normal' as const,
        })),
      };
    case 'add-diagnosis': {
      const added = appendRow(state, 'diagnosis', newDiagnosis);
      return {
        ...state,
        nextRowSequence: added.nextRowSequence,
        diagnoses: [...state.diagnoses, added.row],
      };
    }
    case 'remove-diagnosis':
      return { ...state, diagnoses: state.diagnoses.filter((row) => row.id !== action.id) };
    case 'add-treatment': {
      const added = appendRow(state, 'treatment', newTreatment);
      return {
        ...state,
        nextRowSequence: added.nextRowSequence,
        treatments: [...state.treatments, added.row],
      };
    }
    case 'remove-treatment':
      return { ...state, treatments: state.treatments.filter((row) => row.id !== action.id) };
    case 'add-procedure': {
      const added = appendRow(state, 'procedure', newProcedure);
      return {
        ...state,
        nextRowSequence: added.nextRowSequence,
        procedures: [...state.procedures, added.row],
      };
    }
    case 'remove-procedure':
      return { ...state, procedures: state.procedures.filter((row) => row.id !== action.id) };
    case 'add-prescription': {
      const added = appendRow(state, 'prescription', newPrescription);
      return {
        ...state,
        nextRowSequence: added.nextRowSequence,
        prescriptions: [...state.prescriptions, added.row],
      };
    }
    case 'remove-prescription':
      return {
        ...state,
        prescriptions: state.prescriptions.filter((row) => row.id !== action.id),
      };
    case 'save-draft':
      return { ...state, lastSavedAt: action.savedAt };
    case 'complete-visit':
      return { ...state, status: 'COMPLETED', completedAt: action.completedAt };
  }
}

export function canCompleteAssessment(state: AssessmentState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!state.diagnoses.some((diagnosis) => diagnosis.primary && diagnosis.description.trim())) {
    errors.push('Add a primary diagnosis.');
  }

  if (!state.dischargeDisposition.trim()) {
    errors.push('Select a Discharge Disposition.');
  }

  return { valid: errors.length === 0, errors };
}
