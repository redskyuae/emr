export type DemoSession = {
  id: string;
  sessionNumber: number;
  label: string;
  procedure: string;
  duration: number;
  setupMinutes: number;
  cleaningMinutes: number;
  preparation: string;
  warning: string;
  equipment: string;
  roomType: string;
  therapistSkill: string;
  status: 'Scheduled' | 'Completed' | 'Missed';
};

export type DemoTreatment = {
  id: number;
  name: string;
  code: string;
  responsibleDoctorId: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Complete' | 'Expired';
  plannedSessions: number;
  completedSessions: number;
  sessions: DemoSession[];
  availableToAssign?: boolean;
};

export type DemoRoom = {
  id: number;
  name: string;
  roomType: string;
  location: string;
  capacity: number;
  status: 'Ready' | 'Cleaning required' | 'In use' | 'Blocked' | 'Maintenance';
  conflictReason?: string;
};

export function toBookingTreatment(treatment: {
  id: number;
  name: string;
  code: string;
  durationMinutes: number;
  setupMinutes: number;
  cleaningMinutes: number;
  roomType: string | null;
  therapistSkill: string | null;
  sessions: Array<{
    id: number;
    label: string;
    procedure: string;
    sessionNumber: number;
    durationMinutes: number;
    setupMinutes: number;
    cleaningMinutes: number;
    preparation: string | null;
    warning: string | null;
    equipment: string | null;
    roomType: string | null;
    therapistSkill: string | null;
  }>;
}): DemoTreatment {
  return {
    id: treatment.id,
    name: treatment.name,
    code: treatment.code,
    responsibleDoctorId: 0,
    startDate: 'Not started',
    endDate: 'To be planned',
    status: 'Active',
    plannedSessions: treatment.sessions.length,
    completedSessions: 0,
    availableToAssign: true,
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
      status: 'Scheduled',
    })),
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

const abhyangaSessions: DemoSession[] = [
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
    status: 'Scheduled',
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
    status: 'Scheduled',
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
    status: 'Scheduled',
  },
];

export const DEMO_TREATMENT_CATALOG: DemoTreatment[] = [
  {
    id: 400,
    name: 'Abhyanga wellness programme',
    code: 'TRT-0400',
    responsibleDoctorId: 18,
    startDate: 'Not started',
    endDate: 'To be planned',
    status: 'Active',
    plannedSessions: 6,
    completedSessions: 0,
    availableToAssign: true,
    sessions: abhyangaSessions.map((session, index) => ({
      ...session,
      id: `400-${index + 1}`,
      sessionNumber: index + 1,
      label: `Session ${index + 1} of 6 · Abhyanga + Swedana`,
    })),
  },
  {
    id: 401,
    name: 'Shirodhara relaxation programme',
    code: 'TRT-0401',
    responsibleDoctorId: 31,
    startDate: 'Not started',
    endDate: 'To be planned',
    status: 'Active',
    plannedSessions: 2,
    completedSessions: 0,
    availableToAssign: true,
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

export const DEMO_ROOMS: DemoRoom[] = [
  {
    id: 7,
    name: 'Panchakarma Room 1',
    roomType: 'Panchakarma room',
    location: 'Wellness wing · Level 2',
    capacity: 1,
    status: 'Ready',
  },
  {
    id: 8,
    name: 'Panchakarma Room 2',
    roomType: 'Panchakarma room',
    location: 'Wellness wing · Level 2',
    capacity: 1,
    status: 'Cleaning required',
    conflictReason: 'Cleaning cycle ends at 09:30.',
  },
  {
    id: 9,
    name: 'Consultation Room 4',
    roomType: 'Consultation room',
    location: 'Clinical wing · Level 1',
    capacity: 2,
    status: 'Ready',
    conflictReason: 'Does not meet the Session room requirement.',
  },
  {
    id: 10,
    name: 'Therapy Room 1',
    roomType: 'Therapy room',
    location: 'Wellness wing · Level 2',
    capacity: 1,
    status: 'Ready',
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
