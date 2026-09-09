export type VisitType = 'CONSULTATION' | 'PROCEDURE';
export type ReadinessStatus = 'READY' | 'PENDING' | 'NOT_REQUIRED' | 'BLOCKED';

export type DemoVisit = {
  id: string;
  doctorName: string;
  occurredAt: string;
  visitType: 'Consultation' | 'Procedure' | 'Follow-up';
  status: 'Checked In' | 'In Consultation' | 'Completed' | 'Cancelled';
};

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

export type DemoPatient = {
  id: number;
  mrn: string;
  firstName: string;
  lastName: string;
  phone: string;
  emiratesId: string;
  dateOfBirth: string;
  registrationStatus: 'Registered' | 'Provisional' | 'Inactive';
  treatments: DemoTreatment[];
  visits: DemoVisit[];
  duplicateWarning?: string;
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

export type DemoRota = {
  id: string;
  name: string;
  duration: number;
  slots: { time: string; status: 'Available' | 'Booked' }[];
};

export const DEMO_FACILITY = {
  id: '4',
  name: 'Ayurvedtha Hospital',
  emirate: 'Dubai',
  authority: 'DHA / TCIM',
  timeZone: 'Asia/Dubai (GST)',
};

export const DEMO_DEFAULT_DATE = '2026-09-10';

export const DEMO_DOCTORS = [
  { id: 18, name: 'Dr. Meera Nair', specialty: 'Ayurveda' },
  { id: 24, name: 'Dr. Omar Khalid', specialty: 'General Medicine' },
  { id: 31, name: 'Dr. Anika Menon', specialty: 'Ayurveda' },
  { id: 'not-applicable', name: 'N/A — no Doctor available', specialty: 'Unassigned' },
];

export const DEMO_MODES = [
  { id: '1', name: 'In-person', code: 'IN_PERSON' },
  { id: '2', name: 'Video consultation', code: 'VIDEO' },
];

export const DEMO_TYPES = [
  { id: '1', name: 'New consultation', code: 'NEW' },
  { id: '2', name: 'Procedure', code: 'PROC' },
  { id: '3', name: 'Follow-up', code: 'FOLLOW_UP' },
];

export const DEMO_REASONS = [
  { id: '1', name: 'Treatment session', code: 'TREATMENT' },
  { id: '2', name: 'Review progress', code: 'REVIEW' },
  { id: '3', name: 'General consultation', code: 'CONSULT' },
];

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

export const DEMO_PATIENTS: DemoPatient[] = [
  {
    id: 1001,
    mrn: 'MRN-004281',
    firstName: 'Aisha',
    lastName: 'Rahman',
    phone: '+971 50 555 0182',
    emiratesId: '784-1988-1234567-1',
    dateOfBirth: '1988-04-12',
    registrationStatus: 'Registered',
    duplicateWarning:
      'One possible match found on phone number. Identity verified against Emirates ID.',
    visits: [
      {
        id: 'VIS-8421',
        doctorName: 'Dr. Meera Nair',
        occurredAt: '2026-08-29T10:15:00',
        visitType: 'Procedure',
        status: 'Completed',
      },
      {
        id: 'VIS-8106',
        doctorName: 'Dr. Anika Menon',
        occurredAt: '2026-08-21T09:00:00',
        visitType: 'Consultation',
        status: 'Completed',
      },
      {
        id: 'VIS-7742',
        doctorName: 'Dr. Meera Nair',
        occurredAt: '2026-07-30T14:30:00',
        visitType: 'Follow-up',
        status: 'Cancelled',
      },
      {
        id: 'VIS-7319',
        doctorName: 'Dr. Omar Khalid',
        occurredAt: '2026-06-18T11:00:00',
        visitType: 'Consultation',
        status: 'Completed',
      },
    ],
    treatments: [
      {
        id: 300,
        name: 'Ayurvedic stress recovery programme',
        code: 'TRT-0300',
        responsibleDoctorId: 18,
        startDate: '2026-08-21',
        endDate: '2026-10-16',
        status: 'Active',
        plannedSessions: 8,
        completedSessions: 2,
        sessions: abhyangaSessions,
      },
    ],
  },
  {
    id: 1002,
    mrn: 'MRN-004319',
    firstName: 'Sanjay',
    lastName: 'Iyer',
    phone: '+971 52 555 0109',
    emiratesId: '784-1991-7654321-8',
    dateOfBirth: '1991-11-03',
    registrationStatus: 'Registered',
    visits: [
      {
        id: 'VIS-8188',
        doctorName: 'Dr. Omar Khalid',
        occurredAt: '2026-08-23T16:00:00',
        visitType: 'Consultation',
        status: 'Completed',
      },
    ],
    treatments: [],
  },
  {
    id: 1003,
    mrn: 'MRN-004406',
    firstName: 'Noor',
    lastName: 'Al Mansoori',
    phone: '+971 55 555 0144',
    emiratesId: '784-1996-2345678-4',
    dateOfBirth: '1996-02-18',
    registrationStatus: 'Registered',
    visits: [],
    treatments: [
      {
        id: 301,
        name: 'Back pain supportive care',
        code: 'TRT-0301',
        responsibleDoctorId: 31,
        startDate: '2026-07-01',
        endDate: '2026-08-01',
        status: 'Complete',
        plannedSessions: 4,
        completedSessions: 4,
        sessions: [],
      },
    ],
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
    plannedSessions: 4,
    completedSessions: 0,
    availableToAssign: true,
    sessions: abhyangaSessions.slice(0, 2).map((session, index) => ({
      ...session,
      id: `401-${index + 1}`,
      sessionNumber: index + 1,
      label: `Session ${index + 1} of 4 · Shirodhara`,
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
    conflictReason: 'Skill does not match Abhyanga.',
  },
];

export const DEMO_ROTAS: DemoRota[] = [
  {
    id: '22',
    name: 'Morning OPD Rota',
    duration: 15,
    slots: [
      { time: '09:00', status: 'Available' },
      { time: '09:15', status: 'Available' },
      { time: '09:30', status: 'Booked' },
      { time: '09:45', status: 'Available' },
      { time: '10:00', status: 'Available' },
      { time: '10:15', status: 'Available' },
      { time: '10:30', status: 'Booked' },
      { time: '10:45', status: 'Available' },
      { time: '11:00', status: 'Available' },
      { time: '11:15', status: 'Available' },
      { time: '11:30', status: 'Available' },
      { time: '11:45', status: 'Available' },
    ],
  },
  {
    id: '23',
    name: 'Afternoon OPD Rota',
    duration: 15,
    slots: [
      { time: '14:00', status: 'Available' },
      { time: '14:15', status: 'Available' },
      { time: '14:30', status: 'Available' },
      { time: '14:45', status: 'Available' },
      { time: '15:00', status: 'Available' },
      { time: '15:15', status: 'Booked' },
    ],
  },
];
