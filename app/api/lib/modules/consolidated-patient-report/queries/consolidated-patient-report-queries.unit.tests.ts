import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { doctorRepository } from '../../doctor/repository/doctor-repository';
import type { Doctor } from '../../doctor/schemas/doctor-schema';
import { patientRepository } from '../../patient/repository/patient-repository';
import type { Patient } from '../../patient/schemas/patient-schema';
import { patientMedicationRepository } from '../../patient-medication/repository/patient-medication-repository';
import type { PatientMedication } from '../../patient-medication/schemas/patient-medication-schema';
import { patientTreatmentPlanRepository } from '../../patient-treatment-plan/repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../../patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import type { Tenant } from '../../tenant/schemas/tenant-schema';
import { visitDiagnosisRepository } from '../../visit-diagnosis/repository/visit-diagnosis-repository';
import type { VisitDiagnosis } from '../../visit-diagnosis/schemas/visit-diagnosis-schema';
import { visitRepository } from '../../visit/repository/visit-repository';
import type { Visit } from '../../visit/schemas/visit-schema';
import { consolidatedPatientReportRepository } from '../repository/consolidated-patient-report-repository';
import type { ConsolidatedReportNote } from '../schemas/consolidated-patient-report-schema';
import { getConsolidatedPatientReportQuery } from './get-consolidated-patient-report-query';

vi.mock('../repository/consolidated-patient-report-repository', () => ({
  consolidatedPatientReportRepository: {
    getSignedNotesForVisits: vi.fn(),
    getLatestPainScoresForVisits: vi.fn(),
  },
}));
vi.mock('../../tenant/repository/tenant-repository', () => ({
  tenantRepository: { getTenantById: vi.fn() },
}));
vi.mock('../../patient/repository/patient-repository', () => ({
  patientRepository: { getPatientById: vi.fn() },
}));
vi.mock('../../visit/repository/visit-repository', () => ({
  visitRepository: { getVisits: vi.fn() },
}));
vi.mock('../../doctor/repository/doctor-repository', () => ({
  doctorRepository: { getDoctorById: vi.fn() },
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

const reportRepo = vi.mocked(consolidatedPatientReportRepository);
const getTenantById = vi.mocked(tenantRepository.getTenantById);
const getPatientById = vi.mocked(patientRepository.getPatientById);
const getVisits = vi.mocked(visitRepository.getVisits);
const getDoctorById = vi.mocked(doctorRepository.getDoctorById);
const listByVisit = vi.mocked(visitDiagnosisRepository.listByVisit);
const getMedications = vi.mocked(patientMedicationRepository.getPatientMedications);
const getPlans = vi.mocked(patientTreatmentPlanRepository.getAllByPatientId);

const TENANT = 'tenant-1';
const period = { fromDate: '01-11-2026', toDate: '20-11-2026' };
const options = { generatedBy: 'Dr. Lakshmi Menon' };

const tenant = { name: 'Dhathri Thrissur', logo: null, timeZone: 'Asia/Kolkata' } as Tenant;

const patient = {
  id: 7,
  mrn: 'MRN-1284',
  city: 'Thrissur',
  phone: '+919447012345',
  state: { id: 1, name: 'Kerala' },
  title: 'mr',
  gender: 'male',
  lastName: 'K',
  firstName: 'Rajesh',
  middleName: 'Kumar',
  bloodGroup: 'B+',
  dateOfBirth: '1974-05-02',
  emiratesId: '784-1974-1234567-1',
  createdOn: new Date('2024-03-14T04:00:00Z'),
} as unknown as Patient;

function visit(id: number, visitDate: string, overrides: Partial<Visit> = {}) {
  return {
    id,
    visitDate,
    status: 'COMPLETED',
    visitNumber: `VST-${1000 + id}`,
    chiefComplaint: null,
    doctor: { id: 2, name: 'Dr. Lakshmi Menon' },
    ...overrides,
  } as Visit;
}

// The repository lists newest first.
const visits = [
  visit(13, '20-11-2026', { doctor: null }),
  visit(12, '10-11-2026', { status: 'CANCELLED' }),
  visit(11, '06-11-2026'),
  visit(10, '03-11-2026', { chiefComplaint: 'Pain in both knees' }),
];

function note(id: number, visitId: number, plan: string | null) {
  return {
    id,
    plan,
    visitId,
    signedAt: new Date('2026-11-03T06:00:00Z'),
    objective: null,
    subjective: null,
    assessment: `Note ${id}`,
    authorName: 'Dr. Lakshmi Menon',
    noteType: { name: 'Doctor Consultation', code: 'CONS' },
  } satisfies ConsolidatedReportNote;
}

function session(sessionNumber: number, overrides: Record<string, unknown> = {}) {
  return {
    sessionNumber,
    label: `Day ${sessionNumber}`,
    procedure: 'Janu Basti with Murivenna',
    completionStatus: 'PENDING',
    completedVisitId: null,
    startedVisitId: null,
    ...overrides,
  };
}

function plan(id: number, overrides: Partial<PatientTreatmentPlan>) {
  return {
    id,
    status: 'IN_PROGRESS',
    treatmentName: `Treatment ${id}`,
    totalSessions: 3,
    completedSessions: 0,
    createdOn: new Date('2026-11-01T04:00:00Z'),
    sessions: [],
    ...overrides,
  } as unknown as PatientTreatmentPlan;
}

const plans = [
  plan(1, {
    treatmentName: 'Janu Basti',
    completedSessions: 2,
    sessions: [
      session(1, { completionStatus: 'COMPLETED', completedVisitId: 10, startedVisitId: 10 }),
      session(2, { completionStatus: 'COMPLETED', completedVisitId: 11, startedVisitId: 11 }),
      session(3, { procedure: ' Janu Basti with Murivenna ' }),
    ] as never,
  }),
  // Open and created before the period ends: listed although no Session fell in it.
  plan(2, { status: 'PENDING', treatmentName: 'Matra Basti', sessions: [session(1)] as never }),
  // Finished before the period: left out.
  plan(3, {
    status: 'COMPLETED',
    sessions: [session(1, { completionStatus: 'COMPLETED', completedVisitId: 5 })] as never,
  }),
  // Open but created after the period: left out.
  plan(4, { status: 'PENDING', createdOn: new Date('2026-11-25T04:00:00Z') }),
];

function medication(id: number, overrides: Partial<PatientMedication>) {
  return {
    id,
    dose: '15 ml',
    route: 'Oral',
    status: 'active',
    endDate: null,
    drugName: `Drug ${id}`,
    frequency: 'Twice daily',
    startDate: null,
    createdOn: new Date('2026-10-01T04:00:00Z'),
    modifiedOn: new Date('2026-10-01T04:00:00Z'),
    ...overrides,
  } as PatientMedication;
}

function diagnosis(code: string, title: string) {
  return {
    code,
    title,
    codeSystem: 'AYURVEDA',
    englishName: null,
    diagnosisType: 'PRIMARY',
  } as unknown as VisitDiagnosis;
}

describe('getConsolidatedPatientReportQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTenantById.mockResolvedValue(tenant);
    getPatientById.mockResolvedValue(patient);
    getVisits.mockResolvedValue({ data: visits, total: visits.length } as never);
    getPlans.mockResolvedValue(plans);
    getMedications.mockResolvedValue({
      data: [
        medication(1, {}),
        medication(2, { startDate: '2026-11-21' }),
        medication(3, { status: 'stopped', endDate: '2026-10-15' }),
        medication(4, {
          status: 'stopped',
          modifiedOn: new Date('2026-11-05T04:00:00Z'),
        }),
      ],
      total: 4,
    } as never);
    getDoctorById.mockResolvedValue({
      name: 'Dr. Lakshmi Menon',
      specialtyName: 'Kayachikitsa',
      qualifications: 'BAMS, MD (Ayu)',
    } as Doctor);
    listByVisit.mockImplementation(async (_tenantId, visitId) =>
      visitId === 10
        ? [diagnosis('SV-1', 'Sandhigata Vata')]
        : [diagnosis('SV-1', 'Sandhigata Vata'), diagnosis('AV-2', 'Amavata')]
    );
    reportRepo.getSignedNotesForVisits.mockResolvedValue([
      note(1, 10, 'Start Janu Basti'),
      note(2, 11, 'Continue Kashayam for 30 days'),
      note(3, 11, null),
    ]);
    reportRepo.getLatestPainScoresForVisits.mockResolvedValue([
      { visitId: 10, painScore: 8 },
      { visitId: 11, painScore: 6 },
    ]);
  });

  it('should return validation errors without reading report data', async () => {
    const result = await getConsolidatedPatientReportQuery('abc', TENANT, {}, options);

    expect(result).toEqual({
      success: false,
      errors: ['Patient abc is Invalid.', 'To date is required', 'From date is required'],
    });
    expect(getVisits).not.toHaveBeenCalled();
    expect(reportRepo.getSignedNotesForVisits).not.toHaveBeenCalled();
  });

  it('should return 404 when the Patient is not in the Tenant', async () => {
    getPatientById.mockResolvedValue(undefined);

    const result = await getConsolidatedPatientReportQuery('7', TENANT, period, options);

    expect(result).toEqual({
      success: false,
      errors: ['Patient not found'],
      status: StatusCodes.NOT_FOUND,
    });
    expect(getVisits).not.toHaveBeenCalled();
  });

  it('should read the Patient Visits in the ISO period', async () => {
    await getConsolidatedPatientReportQuery('7', TENANT, period, options);

    expect(getVisits).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT,
        patientId: 7,
        fromDate: '2026-11-01',
        toDate: '2026-11-20',
      })
    );
  });

  it('should list non-cancelled Visits oldest first with notes, pain and Sessions given', async () => {
    const result = await getConsolidatedPatientReportQuery('7', TENANT, period, options);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(reportRepo.getSignedNotesForVisits).toHaveBeenCalledWith(TENANT, [10, 11, 13]);
    expect(result.data.visits.map((item) => item.visitNumber)).toEqual([
      'VST-1010',
      'VST-1011',
      'VST-1013',
    ]);
    expect(result.data.visits[0]).toMatchObject({
      painScore: 8,
      doctorName: 'Dr. Lakshmi Menon',
      notes: [expect.objectContaining({ id: 1 })],
      treatments: [
        {
          label: 'Day 1',
          planId: 1,
          completed: true,
          procedure: 'Janu Basti with Murivenna',
          sessionNumber: 1,
          treatmentName: 'Janu Basti',
          totalSessions: 3,
        },
      ],
    });
    expect(result.data.visits[2]).toMatchObject({ painScore: null, notes: [], treatments: [] });
  });

  it('should summarise diagnoses, complaint, plans, medications and the latest plan', async () => {
    const result = await getConsolidatedPatientReportQuery('7', TENANT, period, options);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.diagnoses).toEqual([
      expect.objectContaining({ code: 'SV-1', firstRecordedOn: '03-11-2026' }),
      expect.objectContaining({ code: 'AV-2', firstRecordedOn: '06-11-2026' }),
    ]);
    expect(result.data.chiefComplaint).toBe('Pain in both knees');
    expect(result.data.treatmentPlans).toEqual([
      {
        id: 1,
        status: 'IN_PROGRESS',
        procedures: ['Janu Basti with Murivenna'],
        treatmentName: 'Janu Basti',
        totalSessions: 3,
        sessionsInPeriod: 2,
        completedSessions: 2,
      },
      expect.objectContaining({ id: 2, treatmentName: 'Matra Basti', sessionsInPeriod: 0 }),
    ]);
    expect(result.data.medications.map((item) => item.id)).toEqual([1, 4]);
    expect(result.data.latestPlan).toEqual({
      plan: 'Continue Kashayam for 30 days',
      authorName: 'Dr. Lakshmi Menon',
      visitNumber: 'VST-1011',
    });
  });

  it('should take the consulting Doctor from the latest Visit that had one', async () => {
    const result = await getConsolidatedPatientReportQuery('7', TENANT, period, options);

    expect(getDoctorById).toHaveBeenCalledWith(2, TENANT);
    expect(result.success && result.data.consultingDoctor).toEqual({
      name: 'Dr. Lakshmi Menon',
      specialtyName: 'Kayachikitsa',
      qualifications: 'BAMS, MD (Ayu)',
    });
  });

  it('should return the Patient without identity documents, and the report context', async () => {
    const result = await getConsolidatedPatientReportQuery('7', TENANT, period, options);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.patient).toEqual({
      id: 7,
      mrn: 'MRN-1284',
      city: 'Thrissur',
      phone: '+919447012345',
      state: 'Kerala',
      title: 'mr',
      gender: 'male',
      lastName: 'K',
      firstName: 'Rajesh',
      middleName: 'Kumar',
      bloodGroup: 'B+',
      dateOfBirth: '1974-05-02',
      registeredOn: new Date('2024-03-14T04:00:00Z'),
    });
    expect(result.data).toMatchObject({
      tenant: { name: 'Dhathri Thrissur', logo: null },
      period,
      timeZone: 'Asia/Kolkata',
      generatedBy: 'Dr. Lakshmi Menon',
    });
  });

  it('should return an empty report without a Doctor when no Visits fall in the period', async () => {
    getVisits.mockResolvedValue({ data: [], total: 0 } as never);
    reportRepo.getSignedNotesForVisits.mockResolvedValue([]);
    reportRepo.getLatestPainScoresForVisits.mockResolvedValue([]);

    const result = await getConsolidatedPatientReportQuery('7', TENANT, period, options);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toMatchObject({
      visits: [],
      diagnoses: [],
      latestPlan: null,
      chiefComplaint: null,
      consultingDoctor: null,
    });
    expect(getDoctorById).not.toHaveBeenCalled();
  });
});
