import { StatusCodes } from 'http-status-codes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentRepository } from '../../appointment/repository/appointment-repository';
import type { Appointment } from '../../appointment/schemas/appointment-schema';
import { invoiceRepository } from '../../invoice/repository/invoice-repository';
import type { Invoice } from '../../invoice/schemas/invoice-schema';
import { patientRepository } from '../../patient/repository/patient-repository';
import type { Patient } from '../../patient/schemas/patient-schema';
import { patientMedicationRepository } from '../../patient-medication/repository/patient-medication-repository';
import type { PatientMedication } from '../../patient-medication/schemas/patient-medication-schema';
import { patientTreatmentPlanRepository } from '../../patient-treatment-plan/repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../../patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import type { Tenant } from '../../tenant/schemas/tenant-schema';
import { visitDiagnosisRepository } from '../../visit-diagnosis/repository/visit-diagnosis-repository';
import { visitRepository } from '../repository/visit-repository';
import { visitSummaryRepository } from '../repository/visit-summary-repository';
import type { Visit } from '../schemas/visit-schema';
import { getVisitSummaryQuery } from './get-visit-summary-query';

vi.mock('../repository/visit-repository', () => ({
  visitRepository: { getVisitById: vi.fn() },
}));
vi.mock('../repository/visit-summary-repository', () => ({
  visitSummaryRepository: {
    getVisitInvoiceId: vi.fn(),
    getSignedVisitNotes: vi.fn(),
    getLatestVisitVitalSign: vi.fn(),
    getActivePatientAllergies: vi.fn(),
  },
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));
vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../visit-diagnosis/repository/visit-diagnosis-repository', () => ({
  visitDiagnosisRepository: { listByVisit: vi.fn() },
}));
vi.mock('../../patient-medication/repository/patient-medication-repository', () => ({
  patientMedicationRepository: { getPatientMedications: vi.fn() },
}));
vi.mock('../../patient-treatment-plan/repository/patient-treatment-plan-repository', () => ({
  patientTreatmentPlanRepository: { getAllByPatientId: vi.fn() },
}));
vi.mock('../../appointment/repository/appointment-repository', () => ({
  appointmentRepository: { getAppointments: vi.fn() },
}));
vi.mock('../../invoice/repository/invoice-repository', () => ({
  invoiceRepository: { getInvoiceById: vi.fn() },
}));

const TENANT = 'tenant-1';
const options = { includeBilling: true, generatedBy: 'Front Desk' };

const visit = {
  id: 10,
  visitNumber: 'VST-1847',
  status: 'COMPLETED',
  visitDate: '18-11-2026',
  chiefComplaint: 'Low back pain',
  cancellationReason: null,
  checkedInAt: new Date('2026-11-18T05:52:00Z'),
  consultationStartedAt: new Date('2026-11-18T06:08:00Z'),
  completedAt: new Date('2026-11-18T07:42:00Z'),
  cancelledAt: null,
  patient: { id: 5 },
  doctor: { id: 2, name: 'Dr. Anjali Menon' },
  visitType: { id: 1, name: 'OPD Consultation', code: 'OPD' },
  appointment: { id: 3, bookingNumber: 'APT-2391' },
} as unknown as Visit;

const patient = {
  id: 5,
  mrn: 'MRN-1284',
  phone: '+971500004127',
  title: 'mrs',
  gender: 'female',
  firstName: 'Lakshmi',
  middleName: null,
  lastName: 'Raghavan',
  bloodGroup: 'B+',
  dateOfBirth: '1974-03-02',
  emiratesId: '784-1974-1234567-1',
} as unknown as Patient;

function session(overrides: Record<string, unknown>) {
  return {
    sessionNumber: 1,
    label: 'Day 1',
    procedure: 'Abhyanga',
    durationMinutes: 45,
    completedVisitId: null,
    startedVisitId: null,
    completionStatus: 'PENDING',
    ...overrides,
  };
}

function plan(overrides: Record<string, unknown>) {
  return {
    id: 1,
    treatmentId: 11,
    treatmentName: 'Abhyanga + Swedana',
    totalSessions: 7,
    completedSessions: 0,
    sessionStructure: 'REPEATABLE',
    status: 'PENDING',
    createdOn: new Date('2026-11-18T06:30:00Z'),
    sessions: [],
    ...overrides,
  } as unknown as PatientTreatmentPlan;
}

const invoice = {
  id: 90,
  invoiceNumber: 'INV-1953',
  status: 'PAID',
  subtotal: 430,
  discountAmount: 25,
  grandTotal: 405,
  amountPaid: 405,
  balanceDue: 0,
  lines: [
    {
      id: 1,
      invoiceId: 90,
      chargeItemId: 4,
      description: 'OPD Consultation, Specialist',
      quantity: 1,
      unitPrice: 250,
      amount: 250,
      source: 'MANUAL',
    },
  ],
  payments: [
    {
      id: 2,
      invoiceId: 90,
      receiptNumber: 'RCP-2210',
      amount: 405,
      method: 'CARD',
      reference: 'xx-4421',
      notes: null,
      receivedAt: new Date('2026-11-18T07:46:00Z'),
    },
  ],
} as unknown as Invoice;

const appointment = {
  id: 44,
  slotDate: '2026-11-20',
  startTime: '09:30',
  bookingNumber: 'APT-2410',
  doctor: null,
  slots: [],
  appointmentStatus: { id: 2, name: 'Confirmed', code: 'CONF', category: 'confirmed' },
  treatment: { id: 12, name: 'Kati Basti', code: 'KB' },
  treatmentSession: { id: 1, sessionNumber: 1 },
} as unknown as Appointment;

describe('getVisitSummaryQuery', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // 08:00 in Dubai on the Visit date, so "today" for the Tenant is 18-11-2026.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-18T04:00:00Z'));
    vi.mocked(visitRepository.getVisitById).mockResolvedValue(visit);
    vi.mocked(tenantRepository.getTenantById).mockResolvedValue({
      id: TENANT,
      name: 'Dhathri Ayurveda Clinic',
      logo: null,
      timeZone: 'Asia/Dubai',
    } as Tenant);
    vi.mocked(patientRepository.getPatientById).mockResolvedValue(patient);
    vi.mocked(visitSummaryRepository.getSignedVisitNotes).mockResolvedValue([]);
    vi.mocked(visitSummaryRepository.getLatestVisitVitalSign).mockResolvedValue(undefined);
    vi.mocked(visitSummaryRepository.getActivePatientAllergies).mockResolvedValue([]);
    vi.mocked(visitSummaryRepository.getVisitInvoiceId).mockResolvedValue(90);
    vi.mocked(visitDiagnosisRepository.listByVisit).mockResolvedValue([]);
    vi.mocked(patientMedicationRepository.getPatientMedications).mockResolvedValue({
      data: [],
      total: 0,
    });
    vi.mocked(patientTreatmentPlanRepository.getAllByPatientId).mockResolvedValue([]);
    vi.mocked(appointmentRepository.getAppointments).mockResolvedValue({ data: [], total: 0 });
    vi.mocked(invoiceRepository.getInvoiceById).mockResolvedValue(invoice);
  });

  it('should reject an invalid Visit ID without reading any repository', async () => {
    const result = await getVisitSummaryQuery('abc', TENANT, options);

    expect(result).toEqual({ success: false, errors: ['Visit abc is Invalid.'] });
    expect(visitRepository.getVisitById).not.toHaveBeenCalled();
  });

  it('should return 404 when the Visit is not in the Tenant', async () => {
    vi.mocked(visitRepository.getVisitById).mockResolvedValue(undefined);

    const result = await getVisitSummaryQuery('10', TENANT, options);

    expect(result).toEqual({
      success: false,
      errors: ['Visit not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(visitRepository.getVisitById).toHaveBeenCalledWith(10, TENANT);
    expect(patientRepository.getPatientById).not.toHaveBeenCalled();
  });

  it('should assemble the Visit, Patient and Tenant without printing identity documents', async () => {
    const result = await getVisitSummaryQuery('10', TENANT, options);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      timeZone: 'Asia/Dubai',
      generatedBy: 'Front Desk',
      generatedAt: expect.any(Date),
      tenant: { name: 'Dhathri Ayurveda Clinic', logo: null },
      visit: {
        visitNumber: 'VST-1847',
        doctorName: 'Dr. Anjali Menon',
        bookingNumber: 'APT-2391',
        visitType: { name: 'OPD Consultation', code: 'OPD' },
      },
      patient: { mrn: 'MRN-1284', bloodGroup: 'B+', dateOfBirth: '1974-03-02' },
    });
    expect(result.data.patient).not.toHaveProperty('emiratesId');
    expect(visitSummaryRepository.getSignedVisitNotes).toHaveBeenCalledWith(TENANT, 10);
    expect(visitSummaryRepository.getActivePatientAllergies).toHaveBeenCalledWith(TENANT, 5);
  });

  it('should read only active medications from the repository', async () => {
    vi.mocked(patientMedicationRepository.getPatientMedications).mockResolvedValue({
      data: [
        { id: 1, drugName: 'Metformin', dose: '500 mg', route: 'Oral', status: 'active' },
      ] as PatientMedication[],
      total: 1,
    });

    const result = await getVisitSummaryQuery('10', TENANT, options);

    expect(patientMedicationRepository.getPatientMedications).toHaveBeenCalledWith({
      patientId: 5,
      status: 'active',
      tenantId: TENANT,
      limit: 1000,
    });
    expect(result.success && result.data.medications).toEqual([
      { id: 1, drugName: 'Metformin', dose: '500 mg', route: 'Oral', frequency: undefined },
    ]);
  });

  it('should describe the session given in this Visit and the open plans', async () => {
    vi.mocked(patientTreatmentPlanRepository.getAllByPatientId).mockResolvedValue([
      plan({
        status: 'IN_PROGRESS',
        completedSessions: 1,
        sessions: [session({ completedVisitId: 10, completionStatus: 'COMPLETED' })],
      }),
      plan({ id: 2, treatmentId: 12, treatmentName: 'Kati Basti' }),
      plan({ id: 3, treatmentName: 'Finished earlier', status: 'COMPLETED' }),
      plan({ id: 4, treatmentName: 'Assigned later', createdOn: new Date('2026-11-19') }),
    ]);

    const result = await getVisitSummaryQuery('10', TENANT, options);

    expect(result.success && result.data.treatmentGiven).toEqual({
      planId: 1,
      label: 'Day 1',
      procedure: 'Abhyanga',
      sessionNumber: 1,
      treatmentName: 'Abhyanga + Swedana',
      totalSessions: 7,
      plannedMinutes: 45,
    });
    expect(result.success && result.data.treatmentPlans.map((item) => item.id)).toEqual([1, 2]);
  });

  it('should find the next Scheduled or Confirmed Appointment after the Visit date', async () => {
    vi.mocked(patientTreatmentPlanRepository.getAllByPatientId).mockResolvedValue([
      plan({ id: 2, treatmentId: 12, treatmentName: 'Kati Basti' }),
    ]);
    vi.mocked(appointmentRepository.getAppointments).mockResolvedValue({
      data: [appointment],
      total: 1,
    });

    const result = await getVisitSummaryQuery('10', TENANT, options);

    expect(appointmentRepository.getAppointments).toHaveBeenCalledWith({
      tenantId: TENANT,
      limit: 1,
      patientId: 5,
      fromDate: '2026-11-19',
      statusCategories: ['SCHEDULED', 'CONFIRMED'],
    });
    expect(result.success && result.data.nextAppointment).toEqual({
      id: 44,
      slotDate: '2026-11-20',
      startTime: '09:30',
      statusName: 'Confirmed',
      doctorName: null,
      bookingNumber: 'APT-2410',
      treatmentName: 'Kati Basti',
      sessionNumber: 1,
      totalSessions: 7,
    });
  });

  it('should not look for the next Appointment before today for an older Visit', async () => {
    // 01:30 on 25-11-2026 in Dubai is still 24-11-2026 in UTC: "today" follows the Tenant.
    vi.setSystemTime(new Date('2026-11-24T21:30:00Z'));

    await getVisitSummaryQuery('10', TENANT, options);

    expect(appointmentRepository.getAppointments).toHaveBeenCalledWith(
      expect.objectContaining({ fromDate: '2026-11-25' })
    );
  });

  it('should include the Visit Invoice with its lines and payments', async () => {
    const result = await getVisitSummaryQuery('10', TENANT, options);

    expect(invoiceRepository.getInvoiceById).toHaveBeenCalledWith(TENANT, 90);
    expect(result.success && result.data.billingIncluded).toBe(true);
    expect(result.success && result.data.billing).toEqual({
      status: 'PAID',
      subtotal: 430,
      grandTotal: 405,
      amountPaid: 405,
      balanceDue: 0,
      invoiceNumber: 'INV-1953',
      discountAmount: 25,
      lines: [
        {
          id: 1,
          amount: 250,
          quantity: 1,
          unitPrice: 250,
          description: 'OPD Consultation, Specialist',
        },
      ],
      payments: [
        {
          id: 2,
          amount: 405,
          method: 'CARD',
          receivedAt: new Date('2026-11-18T07:46:00Z'),
          receiptNumber: 'RCP-2210',
        },
      ],
    });
  });

  it('should return null billing when the Visit has no Invoice', async () => {
    vi.mocked(visitSummaryRepository.getVisitInvoiceId).mockResolvedValue(undefined);

    const result = await getVisitSummaryQuery('10', TENANT, options);

    expect(result.success && result.data.billing).toBeNull();
    expect(invoiceRepository.getInvoiceById).not.toHaveBeenCalled();
  });

  it('should not read billing at all when billing is excluded', async () => {
    const result = await getVisitSummaryQuery('10', TENANT, { ...options, includeBilling: false });

    expect(result.success && result.data.billing).toBeNull();
    expect(result.success && result.data.billingIncluded).toBe(false);
    expect(visitSummaryRepository.getVisitInvoiceId).not.toHaveBeenCalled();
    expect(invoiceRepository.getInvoiceById).not.toHaveBeenCalled();
  });
});
