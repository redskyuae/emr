import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';

export const DEMO_PATIENT_ID = -1001;

export const DEMO_PATIENT: Patient = {
  id: DEMO_PATIENT_ID,
  tenantId: 'demo-tenant',
  mrn: 'MRN-DEMO-0001',
  title: 'mrs',
  firstName: 'Fatima',
  middleName: null,
  lastName: 'Al Mansoori (Demo)',
  gender: 'female',
  dateOfBirth: '1988-03-22',
  bloodGroup: 'O+',
  maritalStatus: 'married',
  preferredPaymentMethod: 'insurance',
  phone: '+971501234567',
  alternatePhone: null,
  email: 'fatima.almansoori@example.com',
  addressLine1: 'Villa 12, Al Wasl Road',
  addressLine2: null,
  city: 'Dubai',
  stateId: null,
  state: null,
  countryId: null,
  country: null,
  postalCode: null,
  nationalityId: null,
  nationality: { id: -1, name: 'Emirati' },
  languageId: null,
  language: { id: -1, name: 'Arabic' },
  religionId: null,
  religion: { id: -1, name: 'Islam' },
  race: 'arab',
  ethnicGroup: 'emirati',
  emiratesId: '784198812345671',
  photoUrl: null,
  patientIdentificationCategory: null,
  passportNumber: 'N9988771',
  uid: null,
  isVip: false,
  smsConsent: true,
  isMedicalTourist: false,
  identityDocuments: [
    {
      id: -9001,
      documentType: 'passport',
      documentNumber: 'N9988771',
      issuingCountryId: null,
      issuingCountry: null,
      expiryDate: '2030-02-10',
      label: null,
    },
  ],
  emergencyContactName: 'Ahmed Al Mansoori',
  emergencyContactRelationship: 'Spouse',
  emergencyContactGender: 'male',
  emergencyContactPhone: '+971509876543',
  isActive: true,
  registrationStatus: 'registered',
  createdOn: new Date('2023-01-10T08:00:00.000Z'),
  modifiedOn: new Date('2026-07-01T08:00:00.000Z'),
};

export type DemoRecentVisit = {
  id: string;
  visitNo: string;
  date: string;
  department: string;
  clinician: string;
  patientType: string;
  visitMode: string;
  visitModeLabel: string;
  status: string;
};

const DEMO_PATIENT_RECENT_VISITS: DemoRecentVisit[] = [
  {
    id: 'DV-1005',
    visitNo: 'V-2026-1005',
    date: '13-08-2026',
    department: 'Cardiology',
    clinician: 'Dr. Sara Al Naqbi',
    patientType: 'established',
    visitMode: 'follow-up-visit',
    visitModeLabel: 'Follow-up Visit',
    status: 'Completed',
  },
  {
    id: 'DV-1004',
    visitNo: 'V-2026-0892',
    date: '14-06-2026',
    department: 'Cardiology',
    clinician: 'Dr. Sara Al Naqbi',
    patientType: 'established',
    visitMode: 'follow-up-visit',
    visitModeLabel: 'Follow-up Visit',
    status: 'Completed',
  },
  {
    id: 'DV-1003',
    visitNo: 'V-2026-0451',
    date: '02-03-2026',
    department: 'General Medicine',
    clinician: 'Dr. Imran Qureshi',
    patientType: 'established',
    visitMode: 'follow-up-visit',
    visitModeLabel: 'Follow-up Visit',
    status: 'Completed',
  },
  {
    id: 'DV-1002',
    visitNo: 'V-2025-2110',
    date: '19-11-2025',
    department: 'General Medicine',
    clinician: 'Dr. Imran Qureshi',
    patientType: 'new-patient',
    visitMode: 'new-visit',
    visitModeLabel: 'New Visit',
    status: 'Completed',
  },
  {
    id: 'DV-1001',
    visitNo: 'V-2025-1876',
    date: '05-09-2025',
    department: 'ENT',
    clinician: 'Dr. Layla Haddad',
    patientType: 'new-patient',
    visitMode: 'new-visit',
    visitModeLabel: 'New Visit',
    status: 'Completed',
  },
];

const RECENT_VISITS_BY_PATIENT_ID: Record<number, DemoRecentVisit[]> = {
  [DEMO_PATIENT_ID]: DEMO_PATIENT_RECENT_VISITS,
};

export function getRecentVisitsForPatient(patientId: number): DemoRecentVisit[] {
  return RECENT_VISITS_BY_PATIENT_ID[patientId] ?? [];
}

function findExactDepartmentVisit(
  patientId: number,
  departmentLabel: string
): DemoRecentVisit | null {
  const visits = getRecentVisitsForPatient(patientId);
  return (
    visits.find((visit) => visit.department.toLowerCase() === departmentLabel.toLowerCase()) ?? null
  );
}

function findRecentVisitForDepartment(
  patientId: number,
  departmentLabel: string
): DemoRecentVisit | null {
  const visits = getRecentVisitsForPatient(patientId);
  if (visits.length === 0) {
    return null;
  }
  return findExactDepartmentVisit(patientId, departmentLabel) ?? visits[0];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const NEW_PATIENT_LOOKBACK_DAYS = 3 * 365;

function parseDemoVisitDate(date: string): Date {
  const [day, month, year] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function daysSince(date: Date, referenceDate: Date): number {
  return Math.floor((referenceDate.getTime() - date.getTime()) / MS_PER_DAY);
}

export type VisitDefaults = { patientType: string; visitMode: string };

const NEW_PATIENT_DEFAULTS: VisitDefaults = { patientType: 'new-patient', visitMode: 'new-visit' };

export function resolveVisitDefaultsForDepartment(
  patientId: number,
  departmentLabel: string,
  referenceDate: Date = new Date()
): VisitDefaults {
  const visits = getRecentVisitsForPatient(patientId);
  const mostRecentVisit = visits[0];
  const hasVisitWithinLookback =
    mostRecentVisit !== undefined &&
    daysSince(parseDemoVisitDate(mostRecentVisit.date), referenceDate) < NEW_PATIENT_LOOKBACK_DAYS;

  if (!hasVisitWithinLookback) {
    return NEW_PATIENT_DEFAULTS;
  }

  const departmentMatch = findRecentVisitForDepartment(patientId, departmentLabel);
  if (!departmentMatch) {
    return NEW_PATIENT_DEFAULTS;
  }

  return { patientType: departmentMatch.patientType, visitMode: departmentMatch.visitMode };
}

const FREE_REVISIT_WINDOW_DAYS = 7;

export function isWithinFreeRevisitWindow(
  patientId: number,
  departmentLabel: string,
  referenceDate: Date = new Date()
): boolean {
  const departmentMatch = findExactDepartmentVisit(patientId, departmentLabel);
  if (!departmentMatch) {
    return false;
  }
  return (
    daysSince(parseDemoVisitDate(departmentMatch.date), referenceDate) <= FREE_REVISIT_WINDOW_DAYS
  );
}
