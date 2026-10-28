import type { VisitStatus } from '@/app/api/lib/modules/visit/schemas/visit-schema';

export type VisitListBillingStatus = 'NOT_BILLED' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID';
export type VisitListPatientType = 'New' | 'Established';

export type VisitListRow = {
  id: number;
  visitNumber: string;
  /** Days before today; 0 is today. Resolved to a date at render time. */
  dayOffset: number;
  checkedInAt: string;
  status: VisitStatus;
  queueToken: number;
  patientType: VisitListPatientType;
  chiefComplaint: string;
  treatment: string | null;
  /** Appointment Booking Number, or null for a Walk-in Visit. */
  bookingNumber: string | null;
  patient: { name: string; mrn: string; phone: string; age: number; sex: 'F' | 'M' };
  doctor: { id: string; name: string };
  visitType: { code: string; name: string };
  billing: { status: VisitListBillingStatus; invoiceNumber: string | null; balanceDue: number };
};

const patients = {
  priya: { name: 'Priya Nair', mrn: 'AYU000110', phone: '+971 52 441 7788', age: 41, sex: 'F' },
  john: { name: 'John Carter', mrn: 'AYU000131', phone: '+971 50 118 2204', age: 58, sex: 'M' },
  anna: { name: 'Anna Petrova', mrn: 'AYU000129', phone: '+7 916 555 0199', age: 36, sex: 'F' },
  rahul: { name: 'Rahul Sharma', mrn: 'AYU000101', phone: '+971 55 302 9911', age: 47, sex: 'M' },
  leena: { name: 'Leena Joseph', mrn: 'AYU000104', phone: '+971 56 774 3120', age: 33, sex: 'F' },
  deepa: { name: 'Deepa Menon', mrn: 'AYU000107', phone: '+971 54 220 6745', age: 52, sex: 'F' },
  khalid: {
    name: 'Khalid Al Nuaimi',
    mrn: 'AYU000112',
    phone: '+971 50 667 4412',
    age: 44,
    sex: 'M',
  },
  maria: { name: 'Maria Santos', mrn: 'AYU000115', phone: '+971 58 903 1175', age: 29, sex: 'F' },
  hashem: {
    name: 'Mohammed Al Hashemi',
    mrn: 'AYU000118',
    phone: '+971 52 816 0053',
    age: 63,
    sex: 'M',
  },
  sneha: { name: 'Sneha Pillai', mrn: 'AYU000121', phone: '+971 55 481 2290', age: 27, sex: 'F' },
} as const;

const doctors = {
  nisha: { id: 'nisha', name: 'Dr. Nisha Menon' },
  arvind: { id: 'arvind', name: 'Dr. Arvind Kumar' },
  sree: { id: 'sree', name: 'Dr. Sreelekha Nair' },
  faisal: { id: 'faisal', name: 'Dr. Faisal Rahman' },
} as const;

const visitTypes = {
  OPD: { code: 'OPD', name: 'OPD Consultation' },
  FUP: { code: 'FUP', name: 'Follow-up' },
  PRC: { code: 'PRC', name: 'Procedure' },
  PNK: { code: 'PNK', name: 'Panchakarma Session' },
} as const;

type Billing = VisitListRow['billing'];

const notBilled: Billing = { status: 'NOT_BILLED', invoiceNumber: null, balanceDue: 0 };
const paid = (invoiceNumber: string): Billing => ({ status: 'PAID', invoiceNumber, balanceDue: 0 });

function visit(
  id: number,
  dayOffset: number,
  checkedInAt: string,
  status: VisitStatus,
  patient: keyof typeof patients,
  doctor: keyof typeof doctors,
  type: keyof typeof visitTypes,
  details: {
    patientType: VisitListPatientType;
    complaint: string;
    treatment?: string;
    booking?: string;
    billing: Billing;
  }
): VisitListRow {
  return {
    id,
    dayOffset,
    checkedInAt,
    status,
    visitNumber: `VST-${id}`,
    queueToken: 0,
    patientType: details.patientType,
    chiefComplaint: details.complaint,
    treatment: details.treatment ?? null,
    bookingNumber: details.booking ?? null,
    patient: patients[patient],
    doctor: doctors[doctor],
    visitType: visitTypes[type],
    billing: details.billing,
  };
}

// Today's rows line up with the Billing Counter seed ledger: the same Patients
// and Visit Numbers, so "Bill at counter" lands on the right Patient.
const unnumberedVisits: VisitListRow[] = [
  visit(1027, 0, '16:20', 'CHECKED_IN', 'sneha', 'sree', 'OPD', {
    patientType: 'New',
    complaint: 'Recurring migraine for three months',
    booking: 'APT-3055',
    billing: notBilled,
  }),
  visit(1023, 0, '11:40', 'COMPLETED', 'maria', 'faisal', 'OPD', {
    patientType: 'Established',
    complaint: 'Lower back pain, review of medication',
    booking: 'APT-3049',
    billing: paid('AUH-INV-2026-002417'),
  }),
  visit(1022, 0, '11:05', 'COMPLETED', 'khalid', 'arvind', 'FUP', {
    patientType: 'Established',
    complaint: 'Knee osteoarthritis follow-up',
    booking: 'APT-3046',
    billing: paid('AUH-INV-2026-002416'),
  }),
  visit(1026, 0, '14:30', 'IN_CONSULTATION', 'priya', 'nisha', 'PNK', {
    patientType: 'Established',
    complaint: 'Panchakarma — Abhyanga and Elakizhi sessions',
    treatment: 'Panchakarma Programme · Session 3 of 7',
    booking: 'APT-3041',
    billing: paid('AUH-INV-2026-002420'),
  }),
  visit(1021, 0, '10:30', 'COMPLETED', 'deepa', 'sree', 'FUP', {
    patientType: 'Established',
    complaint: 'Rheumatoid arthritis, advance for treatment course',
    booking: 'APT-3038',
    billing: notBilled,
  }),
  visit(1025, 0, '14:10', 'CHECKED_IN', 'john', 'arvind', 'OPD', {
    patientType: 'Established',
    complaint: 'Chronic sinusitis, seeking Ayurvedic management',
    billing: notBilled,
  }),
  visit(1020, 0, '09:48', 'COMPLETED', 'leena', 'nisha', 'OPD', {
    patientType: 'New',
    complaint: 'Digestive disturbance and bloating',
    booking: 'APT-3033',
    billing: paid('AUH-INV-2026-002414'),
  }),
  visit(1024, 0, '13:55', 'CANCELLED', 'anna', 'faisal', 'PRC', {
    patientType: 'Established',
    complaint: 'Shirodhara session not delivered',
    billing: notBilled,
  }),
  visit(1019, 0, '09:12', 'COMPLETED', 'rahul', 'arvind', 'OPD', {
    patientType: 'Established',
    complaint: 'Hypertension review',
    booking: 'APT-3029',
    billing: paid('AUH-INV-2026-002413'),
  }),
  visit(1018, 1, '16:05', 'COMPLETED', 'hashem', 'faisal', 'OPD', {
    patientType: 'New',
    complaint: 'Type 2 diabetes, Ayurvedic co-management',
    booking: 'APT-3012',
    billing: {
      status: 'PARTIALLY_PAID',
      invoiceNumber: 'AUH-INV-2026-002398',
      balanceDue: 180,
    },
  }),
  visit(1017, 1, '15:20', 'COMPLETED', 'priya', 'nisha', 'PNK', {
    patientType: 'Established',
    complaint: 'Panchakarma — Session 2 of 7',
    treatment: 'Panchakarma Programme · Session 2 of 7',
    booking: 'APT-3008',
    billing: paid('AUH-INV-2026-002396'),
  }),
  visit(1016, 1, '12:00', 'COMPLETED', 'maria', 'sree', 'FUP', {
    patientType: 'Established',
    complaint: 'Migraine follow-up',
    billing: paid('AUH-INV-2026-002391'),
  }),
  visit(1015, 1, '10:40', 'CANCELLED', 'john', 'arvind', 'OPD', {
    patientType: 'Established',
    complaint: 'Patient requested rescheduling',
    booking: 'APT-3002',
    billing: notBilled,
  }),
  visit(1014, 2, '17:10', 'COMPLETED', 'sneha', 'nisha', 'OPD', {
    patientType: 'New',
    complaint: 'Acne and hormonal imbalance',
    booking: 'APT-2987',
    billing: paid('AUH-INV-2026-002380'),
  }),
  visit(1013, 2, '11:15', 'COMPLETED', 'khalid', 'arvind', 'PRC', {
    patientType: 'Established',
    complaint: 'Janu Basti — knee',
    treatment: 'Janu Basti · Session 4 of 5',
    billing: {
      status: 'FINALIZED',
      invoiceNumber: 'AUH-INV-2026-002376',
      balanceDue: 682.5,
    },
  }),
  visit(1012, 3, '09:30', 'COMPLETED', 'rahul', 'arvind', 'FUP', {
    patientType: 'Established',
    complaint: 'Blood pressure follow-up',
    billing: paid('AUH-INV-2026-002361'),
  }),
  visit(1011, 4, '15:45', 'COMPLETED', 'deepa', 'sree', 'PNK', {
    patientType: 'Established',
    complaint: 'Panchakarma — Session 1 of 6',
    treatment: 'Panchakarma Programme · Session 1 of 6',
    booking: 'APT-2951',
    billing: paid('AUH-INV-2026-002349'),
  }),
  visit(1010, 5, '13:25', 'COMPLETED', 'anna', 'faisal', 'OPD', {
    patientType: 'New',
    complaint: 'Chronic fatigue and sleep disturbance',
    booking: 'APT-2940',
    billing: paid('AUH-INV-2026-002337'),
  }),
  visit(1009, 6, '10:05', 'COMPLETED', 'leena', 'nisha', 'FUP', {
    patientType: 'Established',
    complaint: 'Gastritis follow-up',
    billing: {
      status: 'PARTIALLY_PAID',
      invoiceNumber: 'AUH-INV-2026-002322',
      balanceDue: 75,
    },
  }),
  visit(1008, 8, '16:30', 'COMPLETED', 'hashem', 'faisal', 'OPD', {
    patientType: 'New',
    complaint: 'Joint stiffness and swelling',
    booking: 'APT-2902',
    billing: paid('AUH-INV-2026-002301'),
  }),
  visit(1007, 9, '11:50', 'CANCELLED', 'sneha', 'sree', 'OPD', {
    patientType: 'New',
    complaint: 'Duplicate check-in',
    billing: notBilled,
  }),
  visit(1006, 11, '14:40', 'COMPLETED', 'john', 'arvind', 'OPD', {
    patientType: 'Established',
    complaint: 'Allergic rhinitis',
    booking: 'APT-2871',
    billing: paid('AUH-INV-2026-002280'),
  }),
  visit(1005, 13, '09:55', 'COMPLETED', 'maria', 'faisal', 'OPD', {
    patientType: 'New',
    complaint: 'Lower back pain',
    booking: 'APT-2850',
    billing: paid('AUH-INV-2026-002262'),
  }),
];

// Queue Tokens run per Doctor per day in check-in order and are never reused,
// so a cancelled Visit keeps its number.
function withQueueTokens(rows: VisitListRow[]): VisitListRow[] {
  const next = new Map<string, number>();

  return [...rows]
    .sort((a, b) => b.dayOffset - a.dayOffset || a.checkedInAt.localeCompare(b.checkedInAt))
    .map((row) => {
      const key = `${row.dayOffset}-${row.doctor.id}`;
      const queueToken = (next.get(key) ?? 0) + 1;
      next.set(key, queueToken);

      return { ...row, queueToken };
    });
}

export const staticVisitList = withQueueTokens(unnumberedVisits);

export const VISIT_LIST_DOCTORS = Object.values(doctors);
export const VISIT_LIST_VISIT_TYPES = Object.values(visitTypes);
