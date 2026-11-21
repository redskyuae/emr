import { StatusCodes } from 'http-status-codes';

import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { tenantLocalDateTime } from '../../appointment/schemas/appointment-slot';
import { appointmentRepository } from '../../appointment/repository/appointment-repository';
import { invoiceRepository } from '../../invoice/repository/invoice-repository';
import type { Invoice } from '../../invoice/schemas/invoice-schema';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientMedicationRepository } from '../../patient-medication/repository/patient-medication-repository';
import { patientTreatmentPlanRepository } from '../../patient-treatment-plan/repository/patient-treatment-plan-repository';
import type { PatientTreatmentPlan } from '../../patient-treatment-plan/schemas/patient-treatment-plan-schema';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitDiagnosisRepository } from '../../visit-diagnosis/repository/visit-diagnosis-repository';
import { visitRepository } from '../repository/visit-repository';
import { visitSummaryRepository } from '../repository/visit-summary-repository';
import type { Visit } from '../schemas/visit-schema';
import type {
  VisitSummary,
  VisitSummaryBilling,
  VisitSummaryNextAppointment,
  VisitSummaryOptions,
  VisitSummaryTreatmentGiven,
  VisitSummaryTreatmentPlan,
} from '../schemas/visit-summary-schema';
import { validateGetVisitById } from '../validator/get-visit-by-id-validator';

// Medications are a Patient-level list; one summary prints every active one.
const ACTIVE_MEDICATION_LIMIT = 1000;

// Visit dates are DD-MM-YYYY; Appointment filters take ISO dates.
function dayAfter(visitDate: string) {
  const [day, month, year] = visitDate.split('-');
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

// The next Appointment is the first one after the Visit and not on a day that has already
// passed (an Appointment earlier today can still show if it was never updated).
function nextAppointmentFrom(visitDate: string, timeZone: string, now: Date) {
  const from = dayAfter(visitDate);
  const today = tenantLocalDateTime(now, timeZone).date;
  return from > today ? from : today;
}

function treatmentGivenIn(
  visitId: number,
  plans: PatientTreatmentPlan[]
): VisitSummaryTreatmentGiven | null {
  for (const plan of plans) {
    const session = plan.sessions.find(
      (item) => item.completedVisitId === visitId || item.startedVisitId === visitId
    );

    if (session) {
      return {
        planId: plan.id,
        label: session.label,
        procedure: session.procedure,
        sessionNumber: session.sessionNumber,
        treatmentName: plan.treatmentName,
        totalSessions: plan.totalSessions,
        plannedMinutes: session.durationMinutes,
      };
    }
  }

  return null;
}

// Plans the Patient had by the end of this Visit: still open, or worked on in it.
function plansForVisit(visit: Visit, plans: PatientTreatmentPlan[]): VisitSummaryTreatmentPlan[] {
  const visitEnd = visit.completedAt ?? visit.cancelledAt ?? null;

  return plans
    .filter((plan) => !visitEnd || plan.createdOn <= visitEnd)
    .filter(
      (plan) =>
        plan.status === 'PENDING' ||
        plan.status === 'IN_PROGRESS' ||
        plan.sessions.some(
          (session) => session.completedVisitId === visit.id || session.startedVisitId === visit.id
        )
    )
    .map((plan) => ({
      id: plan.id,
      status: plan.status,
      treatmentName: plan.treatmentName,
      totalSessions: plan.totalSessions,
      completedSessions: plan.completedSessions,
      sessionStructure: plan.sessionStructure,
    }));
}

function toBilling(invoice: Invoice): VisitSummaryBilling {
  return {
    status: invoice.status,
    subtotal: invoice.subtotal,
    grandTotal: invoice.grandTotal,
    amountPaid: invoice.amountPaid,
    balanceDue: invoice.balanceDue,
    invoiceNumber: invoice.invoiceNumber,
    discountAmount: invoice.discountAmount,
    lines: invoice.lines.map((line) => ({
      id: line.id,
      amount: line.amount,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      description: line.description,
    })),
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      receivedAt: payment.receivedAt,
      receiptNumber: payment.receiptNumber,
    })),
  };
}

async function getBilling(tenantId: string, visitId: number) {
  const invoiceId = await visitSummaryRepository.getVisitInvoiceId(tenantId, visitId);

  if (!invoiceId) return null;

  const invoice = await invoiceRepository.getInvoiceById(tenantId, invoiceId);
  return invoice ? toBilling(invoice) : null;
}

async function getNextAppointment(
  tenantId: string,
  visit: Visit,
  plans: PatientTreatmentPlan[],
  timeZone: string,
  now: Date
): Promise<VisitSummaryNextAppointment | null> {
  const { data } = await appointmentRepository.getAppointments({
    tenantId,
    limit: 1,
    patientId: visit.patient.id,
    fromDate: nextAppointmentFrom(visit.visitDate, timeZone, now),
    statusCategories: ['SCHEDULED', 'CONFIRMED'],
  });
  const [appointment] = data;

  if (!appointment) return null;

  const plan = appointment.treatment
    ? plans.find((item) => item.treatmentId === appointment.treatment?.id)
    : undefined;

  return {
    id: appointment.id,
    slotDate: appointment.slotDate,
    startTime: appointment.startTime ?? appointment.slots[0]?.slotTime ?? null,
    statusName: appointment.appointmentStatus.name,
    doctorName: appointment.doctor?.name ?? null,
    bookingNumber: appointment.bookingNumber,
    treatmentName: appointment.treatment?.name ?? null,
    sessionNumber: appointment.treatmentSession?.sessionNumber ?? null,
    totalSessions: plan?.totalSessions ?? null,
  };
}

export async function getVisitSummaryQuery(
  id: unknown,
  tenantId: unknown,
  options: VisitSummaryOptions
): Promise<SingleQueryResult<VisitSummary>> {
  const validationResult = validateGetVisitById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const { id: visitId, tenantId: validTenantId } = validationResult.data;
  const visit = await visitRepository.getVisitById(visitId, validTenantId);

  if (!visit) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  const patientId = visit.patient.id;
  const [tenant, patient, notes, vitalSign, allergies, diagnoses, medications, plans, billing] =
    await Promise.all([
      tenantRepository.getTenantById(validTenantId),
      patientRepository.getPatientById(patientId, validTenantId),
      visitSummaryRepository.getSignedVisitNotes(validTenantId, visitId),
      visitSummaryRepository.getLatestVisitVitalSign(validTenantId, visitId),
      visitSummaryRepository.getActivePatientAllergies(validTenantId, patientId),
      visitDiagnosisRepository.listByVisit(validTenantId, visitId),
      patientMedicationRepository.getPatientMedications({
        patientId,
        status: 'active',
        tenantId: validTenantId,
        limit: ACTIVE_MEDICATION_LIMIT,
      }),
      patientTreatmentPlanRepository.getAllByPatientId(patientId, validTenantId),
      options.includeBilling ? getBilling(validTenantId, visitId) : Promise.resolve(null),
    ]);

  if (!tenant || !patient) {
    return { success: false, errors: ['Visit not found'], status: StatusCodes.NOT_FOUND };
  }

  const generatedAt = new Date();
  const nextAppointment = await getNextAppointment(
    validTenantId,
    visit,
    plans,
    tenant.timeZone,
    generatedAt
  );

  return {
    success: true,
    data: {
      notes,
      billing,
      vitalSign: vitalSign ?? null,
      allergies,
      diagnoses,
      timeZone: tenant.timeZone,
      generatedAt,
      generatedBy: options.generatedBy,
      nextAppointment,
      billingIncluded: options.includeBilling,
      treatmentPlans: plansForVisit(visit, plans),
      treatmentGiven: treatmentGivenIn(visitId, plans),
      tenant: { name: tenant.name, logo: tenant.logo },
      medications: medications.data.map((medication) => ({
        id: medication.id,
        dose: medication.dose,
        route: medication.route,
        drugName: medication.drugName,
        frequency: medication.frequency,
      })),
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        phone: patient.phone,
        title: patient.title,
        gender: patient.gender,
        lastName: patient.lastName,
        firstName: patient.firstName,
        middleName: patient.middleName,
        bloodGroup: patient.bloodGroup,
        dateOfBirth: patient.dateOfBirth,
      },
      visit: {
        id: visit.id,
        status: visit.status,
        visitDate: visit.visitDate,
        doctorName: visit.doctor?.name ?? null,
        visitNumber: visit.visitNumber,
        checkedInAt: visit.checkedInAt,
        completedAt: visit.completedAt,
        cancelledAt: visit.cancelledAt,
        bookingNumber: visit.appointment?.bookingNumber ?? null,
        chiefComplaint: visit.chiefComplaint,
        cancellationReason: visit.cancellationReason,
        consultationStartedAt: visit.consultationStartedAt,
        visitType: { name: visit.visitType.name, code: visit.visitType.code },
      },
    },
  };
}
