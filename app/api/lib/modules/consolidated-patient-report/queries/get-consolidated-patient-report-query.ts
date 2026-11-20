import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantLocalDateTime } from '../../appointment/schemas/appointment-slot';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientMedicationRepository } from '../../patient-medication/repository/patient-medication-repository';
import type { PatientMedication } from '../../patient-medication/schemas/patient-medication-schema';
import { patientTreatmentPlanRepository } from '../../patient-treatment-plan/repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../../patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitDiagnosisRepository } from '../../visit-diagnosis/repository/visit-diagnosis-repository';
import type { VisitDiagnosis } from '../../visit-diagnosis/schemas/visit-diagnosis-schema';
import { visitRepository } from '../../visit/repository/visit-repository';
import type { Visit } from '../../visit/schemas/visit-schema';
import { consolidatedPatientReportRepository } from '../repository/consolidated-patient-report-repository';
import type {
  ConsolidatedPatientReport,
  ConsolidatedReportDiagnosis,
  ConsolidatedReportLatestPlan,
  ConsolidatedReportMedication,
  ConsolidatedReportNote,
  ConsolidatedReportOptions,
  ConsolidatedReportTreatmentPlan,
  ConsolidatedReportVisit,
  ConsolidatedReportVisitTreatment,
} from '../schemas/consolidated-patient-report-schema';
import {
  validateGetConsolidatedPatientReport,
  type GetConsolidatedPatientReportInput,
} from '../validator/get-consolidated-patient-report-validator';

// A year of daily Visits fits; the period is capped at 366 days by the schema.
const MAX_VISITS = 400;
// Medications are a Patient-level list; the report filters it to the period.
const MEDICATION_LIMIT = 1000;

/** ISO `yyyy-mm-dd` as the `DD-MM-YYYY` the Visit APIs use. */
function toDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

function sessionInVisit(
  session: PatientTreatmentPlan['sessions'][number],
  visitIds: ReadonlySet<number>
) {
  return (
    (session.completedVisitId !== null && visitIds.has(session.completedVisitId)) ||
    (session.startedVisitId !== null && visitIds.has(session.startedVisitId))
  );
}

function treatmentsGivenIn(
  visitId: number,
  plans: PatientTreatmentPlan[]
): ConsolidatedReportVisitTreatment[] {
  return plans.flatMap((plan) =>
    plan.sessions
      .filter(
        (session) => session.completedVisitId === visitId || session.startedVisitId === visitId
      )
      .map((session) => ({
        label: session.label,
        planId: plan.id,
        completed: session.completionStatus === 'COMPLETED',
        procedure: session.procedure,
        sessionNumber: session.sessionNumber,
        treatmentName: plan.treatmentName,
        totalSessions: plan.totalSessions,
      }))
  );
}

// Plans worked on in the period, and plans still open that existed by its end.
function plansInPeriod(
  plans: PatientTreatmentPlan[],
  visitIds: ReadonlySet<number>,
  toDate: string,
  timeZone: string
): ConsolidatedReportTreatmentPlan[] {
  return plans
    .filter((plan) => {
      const workedOn = plan.sessions.some((session) => sessionInVisit(session, visitIds));
      const open = plan.status === 'PENDING' || plan.status === 'IN_PROGRESS';

      return workedOn || (open && tenantLocalDateTime(plan.createdOn, timeZone).date <= toDate);
    })
    .map((plan) => {
      const procedures = plan.sessions
        .map((session) => session.procedure?.trim())
        .filter((procedure): procedure is string => !!procedure);

      return {
        id: plan.id,
        status: plan.status,
        procedures: [...new Set(procedures)],
        treatmentName: plan.treatmentName,
        totalSessions: plan.totalSessions,
        sessionsInPeriod: plan.sessions.filter(
          (session) =>
            session.completionStatus === 'COMPLETED' &&
            session.completedVisitId !== null &&
            visitIds.has(session.completedVisitId)
        ).length,
        completedSessions: plan.completedSessions,
      };
    });
}

// Medications taken at any time in the period. A stopped or completed one without an end date
// is taken to have ended when it was last changed.
function medicationsInPeriod(
  medications: PatientMedication[],
  period: { fromDate: string; toDate: string },
  timeZone: string
): ConsolidatedReportMedication[] {
  const localDate = (date: Date) => tenantLocalDateTime(date, timeZone).date;

  return medications
    .filter((medication) => {
      const start = medication.startDate ?? localDate(medication.createdOn);
      const end =
        medication.endDate ??
        (medication.status === 'active' ? null : localDate(medication.modifiedOn));

      return start <= period.toDate && (end === null || end >= period.fromDate);
    })
    .map((medication) => ({
      id: medication.id,
      dose: medication.dose,
      route: medication.route,
      status: medication.status,
      endDate: medication.endDate,
      drugName: medication.drugName,
      frequency: medication.frequency,
      startDate: medication.startDate,
    }));
}

// Each diagnosis once, in the order it was first recorded.
function distinctDiagnoses(
  visits: Visit[],
  diagnosesByVisit: VisitDiagnosis[][]
): ConsolidatedReportDiagnosis[] {
  const seen = new Map<string, ConsolidatedReportDiagnosis>();

  visits.forEach((visit, index) => {
    for (const diagnosis of diagnosesByVisit[index]) {
      const key = `${diagnosis.codeSystem}:${diagnosis.code}`;

      if (!seen.has(key)) {
        seen.set(key, {
          code: diagnosis.code,
          title: diagnosis.title,
          codeSystem: diagnosis.codeSystem,
          englishName: diagnosis.englishName,
          diagnosisType: diagnosis.diagnosisType,
          firstRecordedOn: visit.visitDate,
        });
      }
    }
  });

  return [...seen.values()];
}

// The plan written in the latest signed note that has one.
function latestPlanFrom(visits: ConsolidatedReportVisit[]): ConsolidatedReportLatestPlan | null {
  for (const visit of [...visits].reverse()) {
    const note = [...visit.notes].reverse().find((item) => item.plan?.trim());

    if (note?.plan) {
      return { plan: note.plan, authorName: note.authorName, visitNumber: visit.visitNumber };
    }
  }

  return null;
}

async function getConsultingDoctor(tenantId: string, visits: Visit[]) {
  const doctorId = [...visits].reverse().find((visit) => visit.doctor)?.doctor?.id;
  if (!doctorId) return null;

  const doctor = await doctorRepository.getDoctorById(doctorId, tenantId);

  return doctor
    ? {
        name: doctor.name,
        specialtyName: doctor.specialtyName,
        qualifications: doctor.qualifications,
      }
    : null;
}

export async function getConsolidatedPatientReportQuery(
  patientId: unknown,
  tenantId: unknown,
  input: GetConsolidatedPatientReportInput,
  options: ConsolidatedReportOptions
): Promise<SingleQueryResult<ConsolidatedPatientReport>> {
  const validationResult = await validateGetConsolidatedPatientReport(patientId, tenantId, input);

  if (!validationResult.success) {
    return validationResult;
  }

  const params = validationResult.data;
  const [tenant, patient, visitPage, plans, medications] = await Promise.all([
    tenantRepository.getTenantById(params.tenantId),
    patientRepository.getPatientById(params.patientId, params.tenantId),
    visitRepository.getVisits({
      page: 1,
      limit: MAX_VISITS,
      toDate: params.toDate,
      tenantId: params.tenantId,
      fromDate: params.fromDate,
      patientId: params.patientId,
    }),
    patientTreatmentPlanRepository.getAllByPatientId(params.patientId, params.tenantId),
    patientMedicationRepository.getPatientMedications({
      limit: MEDICATION_LIMIT,
      tenantId: params.tenantId,
      patientId: params.patientId,
    }),
  ]);

  if (!tenant || !patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  // Cancelled Visits gave no care, so they are left out. The list comes newest first.
  const visits = visitPage.data.filter((visit) => visit.status !== 'CANCELLED').reverse();
  const visitIds = visits.map((visit) => visit.id);
  const visitIdSet = new Set(visitIds);

  const [notes, painScores, diagnosesByVisit, consultingDoctor] = await Promise.all([
    consolidatedPatientReportRepository.getSignedNotesForVisits(params.tenantId, visitIds),
    consolidatedPatientReportRepository.getLatestPainScoresForVisits(params.tenantId, visitIds),
    Promise.all(
      visits.map((visit) => visitDiagnosisRepository.listByVisit(params.tenantId, visit.id))
    ),
    getConsultingDoctor(params.tenantId, visits),
  ]);

  const notesByVisit = new Map<number, ConsolidatedReportNote[]>();
  for (const note of notes) {
    notesByVisit.set(note.visitId, [...(notesByVisit.get(note.visitId) ?? []), note]);
  }
  const painByVisit = new Map(painScores.map((row) => [row.visitId, row.painScore]));

  const reportVisits: ConsolidatedReportVisit[] = visits.map((visit) => ({
    id: visit.id,
    notes: notesByVisit.get(visit.id) ?? [],
    status: visit.status,
    visitDate: visit.visitDate,
    painScore: painByVisit.get(visit.id) ?? null,
    treatments: treatmentsGivenIn(visit.id, plans),
    doctorName: visit.doctor?.name ?? null,
    visitNumber: visit.visitNumber,
    chiefComplaint: visit.chiefComplaint,
  }));

  return {
    success: true,
    data: {
      tenant: { name: tenant.name, logo: tenant.logo },
      period: { fromDate: toDisplayDate(params.fromDate), toDate: toDisplayDate(params.toDate) },
      visits: reportVisits,
      timeZone: tenant.timeZone,
      diagnoses: distinctDiagnoses(visits, diagnosesByVisit),
      latestPlan: latestPlanFrom(reportVisits),
      generatedAt: new Date(),
      generatedBy: options.generatedBy,
      medications: medicationsInPeriod(medications.data, params, tenant.timeZone),
      chiefComplaint: visits.find((visit) => visit.chiefComplaint?.trim())?.chiefComplaint ?? null,
      treatmentPlans: plansInPeriod(plans, visitIdSet, params.toDate, tenant.timeZone),
      consultingDoctor,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        city: patient.city,
        phone: patient.phone,
        state: patient.state?.name ?? null,
        title: patient.title,
        gender: patient.gender,
        lastName: patient.lastName,
        firstName: patient.firstName,
        middleName: patient.middleName,
        bloodGroup: patient.bloodGroup,
        dateOfBirth: patient.dateOfBirth,
        registeredOn: patient.createdOn,
      },
    },
  };
}
