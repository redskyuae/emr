export type VisitStatus = 'IN_CONSULTATION' | 'COMPLETED';
export type FindingStatus = 'normal' | 'abnormal' | 'not-reviewed';

export type ClinicalFinding = {
  id: string;
  label: string;
  status: FindingStatus;
  remarks: string;
};

export type DiagnosisRow = {
  id: string;
  code: string;
  description: string;
  type: string;
  reasonForVisit: boolean;
  onsetYear: string;
  narrative: string;
  primary: boolean;
};

export type TreatmentRow = {
  id: string;
  service: string;
  sessions: string;
  summary: string;
  status: string;
};

export type ProcedureRow = {
  id: string;
  code: string;
  description: string;
  quantity: string;
  notes: string;
};

export type PrescriptionRow = {
  id: string;
  medicine: string;
  unit: string;
  route: string;
  dose: string;
  frequency: string;
  duration: string;
  refill: string;
  quantity: string;
  startDate: string;
  endDate: string;
  instruction: string;
};

export type StaticAssessment = {
  vitals: {
    temperature: string;
    systolic: string;
    diastolic: string;
    pulse: string;
    respiratoryRate: string;
    spo2: string;
    oxygen: string;
    height: string;
    weight: string;
  };
  chiefComplaint: string;
  hpi: string;
  hpiMeta: {
    location: string;
    severity: string;
    timing: string;
    modifyingFactor: string;
    context: string;
    duration: string;
    symptom: string;
    quality: string;
  };
  problems: string[];
  historySummary: {
    smoking: string;
    activity: string;
    family: string;
    social: string;
  };
  ros: ClinicalFinding[];
  exam: ClinicalFinding[];
  ayurveda: {
    prakriti: string;
    vikriti: string;
    ashtavidha: string;
  };
  clinicalImpression: string;
  diagnoses: DiagnosisRow[];
  advisedTreatment: string;
  treatments: TreatmentRow[];
  procedures: ProcedureRow[];
  prescriptions: PrescriptionRow[];
  mdm: {
    problemComplexity: string;
    dataReviewed: string[];
    risk: 'Minimal' | 'Low' | 'Moderate' | 'High';
  };
  addendum: string;
  education: string[];
  presentingComplaint: string;
  examinationFinding: string;
  recommendation: string;
  encounterEnd: string;
  dischargeDisposition: string;
};

export type StaticClinicianVisit = {
  id: number;
  visitNumber: string;
  queueToken: number;
  status: VisitStatus;
  visitDate: string;
  checkedInAt: string;
  startedAt: string;
  completedAt?: string;
  tenant: string;
  facility: string;
  visitType: {
    code: string;
    name: string;
  };
  patient: {
    name: string;
    mrn: string;
    age: number;
    sex: string;
    nationality: string;
  };
  doctor: {
    name: string;
    specialty: string;
  };
  allergies: string[];
  assessment: StaticAssessment;
};

export type VisitBoardRow = StaticClinicianVisit & {
  href: string;
};

const systems = [
  ['constitutional', 'Constitutional'],
  ['eyes', 'Eyes'],
  ['ent', 'ENT'],
  ['cardiovascular', 'Cardiovascular'],
  ['respiratory', 'Respiratory'],
  ['gastrointestinal', 'Gastrointestinal'],
  ['genitourinary', 'Genitourinary'],
  ['musculoskeletal', 'Musculoskeletal'],
  ['skin', 'Skin'],
  ['neurologic', 'Neurologic'],
  ['psychiatric', 'Psychiatric'],
  ['endocrine', 'Endocrine'],
  ['hematologic', 'Hematologic / lymphatic'],
  ['allergic', 'Allergic / immunologic'],
] as const;

function normalFindings(): ClinicalFinding[] {
  return systems.map(([id, label]) => ({ id, label, status: 'normal', remarks: '' }));
}

function activeReviewOfSystems(): ClinicalFinding[] {
  return normalFindings().map((finding) =>
    finding.id === 'respiratory'
      ? { ...finding, status: 'abnormal', remarks: 'Dry cough; no shortness of breath.' }
      : finding
  );
}

function activeExamination(): ClinicalFinding[] {
  return [
    ...normalFindings(),
    { id: 'neck', label: 'Neck', status: 'normal', remarks: '' },
    { id: 'chest', label: 'Chest', status: 'abnormal', remarks: 'Scattered expiratory wheeze.' },
  ];
}

export const staticClinicianVisits: StaticClinicianVisit[] = [
  {
    id: 15730,
    visitNumber: 'VST-15730',
    queueToken: 12,
    status: 'IN_CONSULTATION',
    visitDate: '09 Sep 2026',
    checkedInAt: '2026-09-09T09:18:00+05:30',
    startedAt: '2026-09-09T09:31:00+05:30',
    tenant: 'Redsky Demo Health',
    facility: 'Northgate General',
    visitType: { code: 'FUP', name: 'Follow-up Consultation' },
    patient: {
      name: 'Asha Menon',
      mrn: 'MRN-20481',
      age: 42,
      sex: 'Female',
      nationality: 'Indian',
    },
    doctor: { name: 'Dr. Maya Iyer', specialty: 'Internal Medicine' },
    allergies: ['Penicillin — rash (moderate)'],
    assessment: {
      vitals: {
        temperature: '37.2',
        systolic: '128',
        diastolic: '82',
        pulse: '88',
        respiratoryRate: '18',
        spo2: '97',
        oxygen: 'Room air',
        height: '162',
        weight: '68',
      },
      chiefComplaint: 'Persistent dry cough and fatigue for five days.',
      hpi: 'Symptoms began gradually after a viral upper respiratory illness. Cough is worse at night and improves with warm fluids. No chest pain or exertional dyspnoea.',
      hpiMeta: {
        location: 'Chest',
        severity: 'Mild',
        timing: 'At night',
        modifyingFactor: 'Improves with warm fluids',
        context: 'After recent viral illness',
        duration: '5 days',
        symptom: 'Dry cough',
        quality: 'Intermittent',
      },
      problems: ['E11.9 · Type 2 diabetes — controlled', 'J45.909 · Mild intermittent asthma'],
      historySummary: {
        smoking: 'Non-smoker',
        activity: 'Walking · 4 days/week · 30 min',
        family: 'Mother: type 2 diabetes',
        social: 'Teacher · lives with family · no alcohol',
      },
      ros: activeReviewOfSystems(),
      exam: activeExamination(),
      ayurveda: {
        prakriti: 'Pitta predominant · Vata moderate',
        vikriti: 'Vata increased',
        ashtavidha: 'Nadi regular · Jihva mildly coated · Akruti medium',
      },
      clinicalImpression: 'Post-viral cough with mild asthma exacerbation; clinically stable.',
      diagnoses: [
        {
          id: 'diagnosis-1',
          code: 'J45.21',
          description: 'Mild intermittent asthma with acute exacerbation',
          type: 'Working',
          reasonForVisit: true,
          onsetYear: '2019',
          narrative: 'Mild wheeze following viral illness',
          primary: true,
        },
      ],
      advisedTreatment:
        'Continue controller inhaler. Use reliever as needed. Hydration and steam inhalation advised.',
      treatments: [
        {
          id: 'treatment-1',
          service: 'Steam inhalation counselling',
          sessions: '1',
          summary: 'Technique reviewed with Patient',
          status: 'Completed',
        },
      ],
      procedures: [
        {
          id: 'procedure-1',
          code: '94640',
          description: 'Pressurised inhalation treatment',
          quantity: '1',
          notes: 'Demonstration only',
        },
      ],
      prescriptions: [
        {
          id: 'prescription-1',
          medicine: 'Salbutamol inhaler 100 mcg',
          unit: 'Puff',
          route: 'Inhaled',
          dose: '2',
          frequency: 'Every 6 hours PRN',
          duration: '7 days',
          refill: '0',
          quantity: '1 inhaler',
          startDate: '09 Sep',
          endDate: '16 Sep',
          instruction: 'Use with spacer; seek care if symptoms worsen.',
        },
      ],
      mdm: {
        problemComplexity: 'Established problem, mildly worsened',
        dataReviewed: ['Previous Visit', 'Medication list', 'Pulse oximetry'],
        risk: 'Moderate',
      },
      addendum: '',
      education: ['Medication technique', 'Warning signs', 'Diet and hydration'],
      presentingComplaint: 'Dry cough and fatigue for five days.',
      examinationFinding: 'Stable observations; mild expiratory wheeze.',
      recommendation: 'Review in seven days or sooner for breathlessness.',
      encounterEnd: 'Discharged with approval',
      dischargeDisposition: 'Home or self-care',
    },
  },
  {
    id: 15731,
    visitNumber: 'VST-15731',
    queueToken: 8,
    status: 'COMPLETED',
    visitDate: '09 Sep 2026',
    checkedInAt: '2026-09-09T08:42:00+05:30',
    startedAt: '2026-09-09T08:55:00+05:30',
    completedAt: '2026-09-09T09:16:00+05:30',
    tenant: 'Redsky Demo Health',
    facility: 'Northgate General',
    visitType: { code: 'OPD', name: 'OPD Consultation' },
    patient: {
      name: 'Kareem Rahman',
      mrn: 'MRN-19807',
      age: 35,
      sex: 'Male',
      nationality: 'Emirati',
    },
    doctor: { name: 'Dr. Maya Iyer', specialty: 'Internal Medicine' },
    allergies: ['No known allergies'],
    assessment: {
      vitals: {
        temperature: '36.8',
        systolic: '118',
        diastolic: '76',
        pulse: '72',
        respiratoryRate: '16',
        spo2: '99',
        oxygen: 'Room air',
        height: '176',
        weight: '74',
      },
      chiefComplaint: 'Annual wellness review.',
      hpi: 'No acute concerns. Sleep, appetite, and exercise tolerance are unchanged.',
      hpiMeta: {
        location: 'General',
        severity: 'None',
        timing: 'Routine',
        modifyingFactor: 'Not applicable',
        context: 'Annual review',
        duration: 'Today',
        symptom: 'None',
        quality: 'Stable',
      },
      problems: ['E78.0 · Hypercholesterolaemia — controlled'],
      historySummary: {
        smoking: 'Non-smoker',
        activity: 'Cycling · 3 days/week · 45 min',
        family: 'Father: hypertension',
        social: 'Architect · married · light social alcohol use',
      },
      ros: normalFindings(),
      exam: [
        ...normalFindings(),
        { id: 'neck', label: 'Neck', status: 'normal', remarks: '' },
        { id: 'chest', label: 'Chest', status: 'normal', remarks: '' },
      ],
      ayurveda: {
        prakriti: 'Kapha moderate · Pitta moderate',
        vikriti: 'No material imbalance noted',
        ashtavidha: 'Nadi regular · Jihva clear · Akruti medium',
      },
      clinicalImpression: 'Well adult examination; no acute abnormality.',
      diagnoses: [
        {
          id: 'diagnosis-1',
          code: 'Z00.00',
          description: 'General adult medical examination',
          type: 'Final',
          reasonForVisit: true,
          onsetYear: '2026',
          narrative: 'Routine wellness examination',
          primary: true,
        },
      ],
      advisedTreatment: 'Continue healthy diet and regular aerobic activity.',
      treatments: [],
      procedures: [],
      prescriptions: [],
      mdm: {
        problemComplexity: 'Single stable established problem',
        dataReviewed: ['Previous laboratory results', 'Medication list'],
        risk: 'Low',
      },
      addendum: 'Preventive screening schedule reviewed with Patient.',
      education: ['Diet and nutrition', 'Exercise goals', 'Preventive screening'],
      presentingComplaint: 'Annual wellness review.',
      examinationFinding: 'Normal systemic examination.',
      recommendation: 'Repeat lipid profile in six months.',
      encounterEnd: 'Discharged with approval',
      dischargeDisposition: 'Home or self-care',
    },
  },
];

export function getStaticClinicianVisit(id: number): StaticClinicianVisit | undefined {
  if (!Number.isFinite(id) || !Number.isInteger(id)) {
    return undefined;
  }

  return staticClinicianVisits.find((visit) => visit.id === id);
}

export function toVisitBoardRows(): VisitBoardRow[] {
  return staticClinicianVisits.map((visit) => ({
    ...visit,
    href: `/visits/${visit.id}/assessment`,
  }));
}
