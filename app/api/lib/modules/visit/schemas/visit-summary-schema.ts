import type { AllergySeverity } from '../../patient-allergy/schemas/patient-allergy-schema';
import type {
  PatientBloodGroup,
  PatientGender,
  PatientTitle,
} from '../../patient/schemas/patient-schema';
import type { InvoiceStatus, PaymentMethod } from '../../invoice/schemas/invoice-schema';
import type { VisitDiagnosis } from '../../visit-diagnosis/schemas/visit-diagnosis-schema';
import type { PatientTreatmentPlanStatus } from '../../patient-treatment-plan/schemas/patient-treatment-plan-schema';
import type { VisitStatus } from './visit-schema';

export type VisitSummaryTenant = {
  name: string;
  logo: string | null;
};

export type VisitSummaryPatient = {
  id: number;
  mrn: string;
  phone: string;
  title: PatientTitle | null;
  gender: PatientGender | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
  bloodGroup: PatientBloodGroup | null;
  dateOfBirth: string | null;
};

export type VisitSummaryVisit = {
  id: number;
  status: VisitStatus;
  visitDate: string;
  doctorName: string | null;
  visitNumber: string;
  checkedInAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  bookingNumber: string | null;
  chiefComplaint: string | null;
  cancellationReason: string | null;
  consultationStartedAt: Date | null;
  visitType: { name: string; code: string };
};

export type VisitSummaryAllergy = {
  id: number;
  name: string;
  reaction: string | null;
  severity: AllergySeverity;
};

export type VisitSummaryVitalSign = {
  id: number;
  bmi: number | null;
  spo2: number | null;
  heightCm: number | null;
  weightKg: number | null;
  systolic: number | null;
  pulseBpm: number | null;
  respRate: number | null;
  diastolic: number | null;
  painScore: number | null;
  recordedAt: Date;
  temperatureC: number | null;
};

export type VisitSummaryNote = {
  id: number;
  plan: string | null;
  signedAt: Date | null;
  amendedAt: Date | null;
  objective: string | null;
  subjective: string | null;
  assessment: string | null;
  authorName: string | null;
  noteType: { name: string; code: string };
};

export type VisitSummaryTreatmentGiven = {
  planId: number;
  label: string | null;
  procedure: string | null;
  sessionNumber: number;
  treatmentName: string;
  totalSessions: number;
  plannedMinutes: number | null;
};

export type VisitSummaryTreatmentPlan = {
  id: number;
  status: PatientTreatmentPlanStatus;
  treatmentName: string;
  totalSessions: number;
  completedSessions: number;
  sessionStructure: 'REPEATABLE' | 'SEQUENCED';
};

export type VisitSummaryMedication = {
  id: number;
  dose: string | null;
  route: string | null;
  drugName: string;
  frequency: string | null;
};

export type VisitSummaryNextAppointment = {
  id: number;
  slotDate: string;
  startTime: string | null;
  statusName: string;
  doctorName: string | null;
  bookingNumber: string;
  treatmentName: string | null;
  sessionNumber: number | null;
  totalSessions: number | null;
};

export type VisitSummaryInvoiceLine = {
  id: number;
  amount: number;
  quantity: number;
  unitPrice: number;
  description: string;
};

export type VisitSummaryPayment = {
  id: number;
  amount: number;
  method: PaymentMethod;
  receivedAt: Date;
  receiptNumber: string;
};

export type VisitSummaryBilling = {
  status: InvoiceStatus;
  subtotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  invoiceNumber: string;
  discountAmount: number;
  lines: VisitSummaryInvoiceLine[];
  payments: VisitSummaryPayment[];
};

export type VisitSummary = {
  notes: VisitSummaryNote[];
  visit: VisitSummaryVisit;
  tenant: VisitSummaryTenant;
  patient: VisitSummaryPatient;
  timeZone: string;
  billing: VisitSummaryBilling | null;
  vitalSign: VisitSummaryVitalSign | null;
  allergies: VisitSummaryAllergy[];
  diagnoses: VisitDiagnosis[];
  generatedAt: Date;
  generatedBy: string | null;
  medications: VisitSummaryMedication[];
  treatmentGiven: VisitSummaryTreatmentGiven | null;
  treatmentPlans: VisitSummaryTreatmentPlan[];
  nextAppointment: VisitSummaryNextAppointment | null;
  billingIncluded: boolean;
};

export type VisitSummaryOptions = {
  generatedBy: string | null;
  includeBilling: boolean;
};
