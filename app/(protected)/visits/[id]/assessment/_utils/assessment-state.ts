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
  allergies: string[];
  status: VisitStatus;
  completedAt?: string;
  lastSavedAt?: string;
  nextRowSequence: number;
};

export type AssessmentAction =
  | { type: 'update-field'; field: EditableTextField; value: string }
  | { type: 'update-vital'; field: keyof StaticAssessment['vitals']; value: string }
  | { type: 'update-hpi-meta'; field: keyof StaticAssessment['hpiMeta']; value: string }
  | {
      type: 'update-history-summary';
      field: keyof StaticAssessment['historySummary'];
      value: string;
    }
  | { type: 'update-ayurveda'; field: keyof StaticAssessment['ayurveda']; value: string }
  | { type: 'add-allergy' }
  | { type: 'update-allergy'; index: number; value: string }
  | { type: 'remove-allergy'; index: number }
  | { type: 'add-problem' }
  | { type: 'update-problem'; index: number; value: string }
  | { type: 'remove-problem'; index: number }
  | { type: 'update-finding'; target: 'ros' | 'exam'; id: string; status: FindingStatus }
  | {
      type: 'update-finding-remarks';
      target: 'ros' | 'exam';
      id: string;
      remarks: string;
    }
  | { type: 'mark-all-normal'; target: 'ros' | 'exam' }
  | { type: 'add-diagnosis' }
  | { type: 'remove-diagnosis'; id: string }
  | {
      type: 'update-diagnosis';
      id: string;
      field: keyof Omit<DiagnosisRow, 'id'>;
      value: string | boolean;
    }
  | { type: 'add-treatment' }
  | { type: 'remove-treatment'; id: string }
  | {
      type: 'update-treatment';
      id: string;
      field: keyof Omit<TreatmentRow, 'id'>;
      value: string;
    }
  | { type: 'add-procedure' }
  | { type: 'remove-procedure'; id: string }
  | {
      type: 'update-procedure';
      id: string;
      field: keyof Omit<ProcedureRow, 'id'>;
      value: string;
    }
  | { type: 'add-prescription' }
  | { type: 'remove-prescription'; id: string }
  | {
      type: 'update-prescription';
      id: string;
      field: keyof Omit<PrescriptionRow, 'id'>;
      value: string;
    }
  | {
      type: 'update-mdm';
      field: 'problemComplexity' | 'risk';
      value: string;
    }
  | { type: 'toggle-mdm-data'; item: string }
  | { type: 'toggle-education'; item: string }
  | { type: 'save-draft'; savedAt: string }
  | { type: 'complete-visit'; completedAt: string };

export function createAssessmentState(visit: StaticClinicianVisit): AssessmentState {
  return {
    ...structuredClone(visit.assessment),
    allergies: structuredClone(visit.allergies),
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
    case 'update-vital':
      return { ...state, vitals: { ...state.vitals, [action.field]: action.value } };
    case 'update-hpi-meta':
      return { ...state, hpiMeta: { ...state.hpiMeta, [action.field]: action.value } };
    case 'update-history-summary':
      return {
        ...state,
        historySummary: { ...state.historySummary, [action.field]: action.value },
      };
    case 'update-ayurveda':
      return { ...state, ayurveda: { ...state.ayurveda, [action.field]: action.value } };
    case 'add-allergy':
      return { ...state, allergies: [...state.allergies, 'New allergy'] };
    case 'update-allergy':
      return {
        ...state,
        allergies: state.allergies.map((item, index) =>
          index === action.index ? action.value : item
        ),
      };
    case 'remove-allergy':
      return {
        ...state,
        allergies: state.allergies.filter((_, index) => index !== action.index),
      };
    case 'add-problem':
      return { ...state, problems: [...state.problems, 'New problem'] };
    case 'update-problem':
      return {
        ...state,
        problems: state.problems.map((item, index) =>
          index === action.index ? action.value : item
        ),
      };
    case 'remove-problem':
      return {
        ...state,
        problems: state.problems.filter((_, index) => index !== action.index),
      };
    case 'update-finding':
      return {
        ...state,
        [action.target]: updateFinding(state[action.target], action.id, action.status),
      };
    case 'update-finding-remarks':
      return {
        ...state,
        [action.target]: state[action.target].map((finding) =>
          finding.id === action.id ? { ...finding, remarks: action.remarks } : finding
        ),
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
    case 'update-diagnosis':
      return {
        ...state,
        diagnoses: state.diagnoses.map((row) =>
          row.id === action.id ? { ...row, [action.field]: action.value } : row
        ) as DiagnosisRow[],
      };
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
    case 'update-treatment':
      return {
        ...state,
        treatments: state.treatments.map((row) =>
          row.id === action.id ? { ...row, [action.field]: action.value } : row
        ),
      };
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
    case 'update-procedure':
      return {
        ...state,
        procedures: state.procedures.map((row) =>
          row.id === action.id ? { ...row, [action.field]: action.value } : row
        ),
      };
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
    case 'update-prescription':
      return {
        ...state,
        prescriptions: state.prescriptions.map((row) =>
          row.id === action.id ? { ...row, [action.field]: action.value } : row
        ),
      };
    case 'update-mdm':
      return {
        ...state,
        mdm: { ...state.mdm, [action.field]: action.value },
      } as AssessmentState;
    case 'toggle-mdm-data':
      return {
        ...state,
        mdm: {
          ...state.mdm,
          dataReviewed: state.mdm.dataReviewed.includes(action.item)
            ? state.mdm.dataReviewed.filter((item) => item !== action.item)
            : [...state.mdm.dataReviewed, action.item],
        },
      };
    case 'toggle-education':
      return {
        ...state,
        education: state.education.includes(action.item)
          ? state.education.filter((item) => item !== action.item)
          : [...state.education, action.item],
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
