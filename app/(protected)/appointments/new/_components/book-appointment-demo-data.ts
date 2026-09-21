import type { PatientTreatmentPlan } from '@/app/api/lib/modules/patient-treatment-plan/schemas/patient-treatment-plan-schema';

export type BookingSession = {
  id: string;
  sessionNumber: number;
  label: string;
  procedure: string;
  duration: number | null;
  setupMinutes: number | null;
  cleaningMinutes: number | null;
  preparation: string;
  warning: string;
  equipment: string;
  roomType: string;
  therapistSkill: string;
  status: 'Pending' | 'Completed' | 'Unavailable';
  isBookable: boolean;
  unavailableReason: 'Completed' | 'Reserved by another Appointment' | null;
};

export type BookingTreatment = {
  id: number;
  treatmentId: number | null;
  patientTreatmentPlanId: number | null;
  name: string;
  code: string;
  sessionStructure: 'REPEATABLE' | 'SEQUENCED';
  defaultTotalSessions: number | null;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Stopped' | 'Available To Assign';
  plannedSessions: number;
  completedSessions: number;
  sessions: BookingSession[];
  selectionMode: 'EXISTING_PLAN' | 'CATALOGUE';
};

export function toBookingTreatment(treatment: {
  id: number;
  name: string;
  code: string;
  durationMinutes: number | null;
  setupMinutes: number | null;
  cleaningMinutes: number | null;
  roomType: string | null;
  therapistSkill: string | null;
  sessionStructure?: 'REPEATABLE' | 'SEQUENCED';
  defaultTotalSessions?: number | null;
  sessions: Array<{
    id: number;
    label: string;
    procedure: string;
    sessionNumber: number;
    durationMinutes: number | null;
    setupMinutes: number | null;
    cleaningMinutes: number | null;
    preparation: string | null;
    warning: string | null;
    equipment: string | null;
    roomType: string | null;
    therapistSkill: string | null;
  }>;
}): BookingTreatment {
  return {
    id: treatment.id,
    treatmentId: treatment.id,
    patientTreatmentPlanId: null,
    name: treatment.name,
    code: treatment.code,
    sessionStructure: treatment.sessionStructure ?? 'SEQUENCED',
    defaultTotalSessions: treatment.defaultTotalSessions ?? null,
    status: 'Available To Assign',
    plannedSessions:
      treatment.sessionStructure === 'REPEATABLE'
        ? (treatment.defaultTotalSessions ?? 1)
        : treatment.sessions.length,
    completedSessions: 0,
    selectionMode: 'CATALOGUE',
    sessions: treatment.sessions.map((session) => ({
      id: String(session.id),
      sessionNumber: session.sessionNumber,
      label: session.label,
      procedure: session.procedure,
      duration: session.durationMinutes,
      setupMinutes: session.setupMinutes,
      cleaningMinutes: session.cleaningMinutes,
      preparation: session.preparation ?? '',
      warning: session.warning ?? '',
      equipment: session.equipment ?? '',
      roomType: session.roomType ?? treatment.roomType ?? '',
      therapistSkill: session.therapistSkill ?? treatment.therapistSkill ?? '',
      status: 'Pending',
      isBookable: true,
      unavailableReason: null,
    })),
  };
}

const PLAN_STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  STOPPED: 'Stopped',
} as const;

export function toBookingPatientTreatmentPlan(plan: PatientTreatmentPlan): BookingTreatment {
  return {
    id: plan.id,
    treatmentId: plan.treatmentId,
    patientTreatmentPlanId: plan.id,
    name: plan.treatmentName,
    code: plan.treatmentCode,
    sessionStructure: plan.sessionStructure,
    defaultTotalSessions: null,
    status: PLAN_STATUS_LABELS[plan.status],
    plannedSessions: plan.totalSessions,
    completedSessions: plan.completedSessions,
    selectionMode: 'EXISTING_PLAN',
    sessions: plan.sessions.map((session) => ({
      id: String(session.id),
      sessionNumber: session.sessionNumber,
      label: session.label ?? `Session ${session.sessionNumber} of ${plan.totalSessions}`,
      procedure: session.procedure ?? plan.treatmentName,
      duration: session.durationMinutes,
      setupMinutes: session.setupMinutes,
      cleaningMinutes: session.cleaningMinutes,
      preparation: session.preparation ?? '',
      warning: session.warning ?? '',
      equipment: session.equipment ?? '',
      roomType: session.roomType ?? '',
      therapistSkill: session.therapistSkill ?? '',
      status:
        session.completionStatus === 'COMPLETED'
          ? 'Completed'
          : session.isBookable
            ? 'Pending'
            : 'Unavailable',
      isBookable: session.isBookable,
      unavailableReason:
        session.unavailableReason === 'COMPLETED'
          ? 'Completed'
          : session.unavailableReason === 'RESERVED'
            ? 'Reserved by another Appointment'
            : null,
    })),
  };
}

export type TreatmentSelectionState =
  'LOADING' | 'PLANS' | 'CONFLICT' | 'CATALOGUE' | 'CATALOGUE_FORBIDDEN';

export function getTreatmentSelectionState({
  isLoading,
  plans,
  canAssign,
}: {
  isLoading: boolean;
  plans: BookingTreatment[];
  canAssign: boolean;
}): TreatmentSelectionState {
  if (isLoading) return 'LOADING';
  if (plans.length > 0) {
    return plans.some((plan) => plan.sessions.some((session) => session.isBookable))
      ? 'PLANS'
      : 'CONFLICT';
  }
  return canAssign ? 'CATALOGUE' : 'CATALOGUE_FORBIDDEN';
}

export function getDefaultTreatmentSelection(
  plans: BookingTreatment[],
  selectedPlanId: string,
  selectedSessionId = ''
) {
  const plan =
    plans.length === 1
      ? plans[0]
      : plans.find((candidate) => String(candidate.patientTreatmentPlanId) === selectedPlanId);
  const selectedSession = plan?.sessions.find(
    (candidate) => candidate.id === selectedSessionId && candidate.isBookable
  );
  const session =
    selectedSession ??
    plan?.sessions
      .filter((candidate) => candidate.isBookable)
      .sort((left, right) => left.sessionNumber - right.sessionNumber)[0];

  return {
    patientTreatmentPlanId: plan ? String(plan.patientTreatmentPlanId) : '',
    patientTreatmentPlanSessionId: session?.id ?? '',
  };
}

export type DemoTherapist = {
  id: number;
  name: string;
  role: string;
  license: string;
  skill: string;
  active: boolean;
  facility: string;
  workload: string;
  conflictReason?: string;
};

export const DEMO_FACILITY = {
  id: '4',
  name: 'Ayurvedtha Hospital',
  emirate: 'Dubai',
  authority: 'DHA / TCIM',
  timeZone: 'Asia/Dubai (GST)',
};

const abhyangaSessions: BookingSession[] = [
  {
    id: '300-3',
    sessionNumber: 3,
    label: 'Session 3 of 8 · Abhyanga + Swedana',
    procedure: 'Abhyanga + Swedana',
    duration: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    preparation: 'Patient to arrive hydrated; remove jewellery before treatment.',
    warning: 'Confirm oil allergy screening before starting.',
    equipment: 'Steam cabinet, warm sesame oil, towels',
    roomType: 'Panchakarma room',
    therapistSkill: 'Abhyanga',
    status: 'Pending',
    isBookable: true,
    unavailableReason: null,
  },
  {
    id: '300-4',
    sessionNumber: 4,
    label: 'Session 4 of 8 · Abhyanga + Swedana',
    procedure: 'Abhyanga + Swedana',
    duration: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    preparation: 'Review response from Session 3 before treatment.',
    warning: 'Check blood pressure if dizziness was reported previously.',
    equipment: 'Steam cabinet, warm sesame oil, towels',
    roomType: 'Panchakarma room',
    therapistSkill: 'Abhyanga',
    status: 'Pending',
    isBookable: true,
    unavailableReason: null,
  },
  {
    id: '300-5',
    sessionNumber: 5,
    label: 'Session 5 of 8 · Abhyanga + Swedana',
    procedure: 'Abhyanga + Swedana',
    duration: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    preparation: 'Review treatment plan with the responsible Doctor.',
    warning: 'Confirm oil allergy screening before starting.',
    equipment: 'Steam cabinet, warm sesame oil, towels',
    roomType: 'Panchakarma room',
    therapistSkill: 'Abhyanga',
    status: 'Pending',
    isBookable: true,
    unavailableReason: null,
  },
];

export const DEMO_TREATMENT_CATALOG: BookingTreatment[] = [
  {
    id: 400,
    treatmentId: 400,
    patientTreatmentPlanId: null,
    name: 'Abhyanga wellness programme',
    code: 'TRT-0400',
    sessionStructure: 'SEQUENCED',
    defaultTotalSessions: null,
    status: 'Available To Assign',
    plannedSessions: 6,
    completedSessions: 0,
    selectionMode: 'CATALOGUE',
    sessions: abhyangaSessions.map((session, index) => ({
      ...session,
      id: `400-${index + 1}`,
      sessionNumber: index + 1,
      label: `Session ${index + 1} of 6 · Abhyanga + Swedana`,
    })),
  },
  {
    id: 401,
    treatmentId: 401,
    patientTreatmentPlanId: null,
    name: 'Shirodhara relaxation programme',
    code: 'TRT-0401',
    sessionStructure: 'SEQUENCED',
    defaultTotalSessions: null,
    status: 'Available To Assign',
    plannedSessions: 2,
    completedSessions: 0,
    selectionMode: 'CATALOGUE',
    sessions: abhyangaSessions.slice(0, 2).map((session, index) => ({
      ...session,
      id: `401-${index + 1}`,
      sessionNumber: index + 1,
      label: `Session ${index + 1} of 2 · Shirodhara`,
      procedure: 'Shirodhara',
      therapistSkill: 'Shirodhara',
      roomType: 'Therapy room',
    })),
  },
];

export const DEMO_THERAPISTS: DemoTherapist[] = [
  {
    id: 41,
    name: 'Leela Krishnan',
    role: 'Ayurveda Therapist',
    license: 'DHA-TCIM-1842',
    skill: 'Abhyanga',
    active: true,
    facility: 'Ayurvedtha Hospital',
    workload: '2 sessions today',
  },
  {
    id: 42,
    name: 'Maya Thomas',
    role: 'Ayurveda Therapist',
    license: 'DHA-TCIM-1908',
    skill: 'Abhyanga',
    active: true,
    facility: 'Ayurvedtha Hospital',
    workload: '4 sessions today',
    conflictReason: 'On a concurrent session from 09:00–10:15.',
  },
  {
    id: 43,
    name: 'Ravi Menon',
    role: 'Ayurveda Therapist',
    license: 'DHA-TCIM-1771',
    skill: 'Shirodhara',
    active: true,
    facility: 'Ayurvedtha Hospital',
    workload: '1 session today',
  },
];
