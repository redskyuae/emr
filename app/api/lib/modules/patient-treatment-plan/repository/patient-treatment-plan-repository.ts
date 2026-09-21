import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import { patient as patientTable } from '@/app/db/schema/patient';
import {
  patientTreatmentPlan as planTable,
  patientTreatmentPlanSession as sessionTable,
  patientTreatmentPlanSessionReservation as reservationTable,
} from '@/app/db/schema/patient-treatment-plan';
import {
  treatment as treatmentTable,
  treatmentSession as templateTable,
} from '@/app/db/schema/treatment';
import { visit as visitTable } from '@/app/db/schema/visit';
import type {
  PatientTreatmentPlan,
  PatientTreatmentPlanRecord,
  PatientTreatmentPlanSession,
  PatientTreatmentPlanReadSession,
  PatientTreatmentPlanSessionReservedAppointment,
  PatientTreatmentPlanStatus,
} from '../schemas/patient-treatment-plan-schema';

export type PatientTreatmentPlanTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type CatalogueAssignment = {
  tenantId: string;
  patientId: number;
  treatmentId: number;
  totalSessions?: number;
};

export type PlanSessionBookingContext = {
  tenantId: string;
  patientId: number;
  treatmentId: number | null;
  treatmentName: string;
  treatmentCode: string;
  treatmentSourceIdentity: string | null;
  sessionStructure: 'REPEATABLE' | 'SEQUENCED';
  totalSessions: number;
  patientTreatmentPlanId: number;
  patientTreatmentPlanSessionId: number;
  treatmentSessionId: number | null;
  sessionNumber: number;
  label: string | null;
  procedure: string | null;
  durationMinutes: number | null;
  setupMinutes: number | null;
  cleaningMinutes: number | null;
  preparation: string | null;
  warning: string | null;
  equipment: string | null;
  roomType: string | null;
  therapistSkill: string | null;
  legacyConductionNote: string | null;
};

export type CreatedPatientTreatmentPlan = {
  patientTreatmentPlanId: number;
  totalSessions: number;
  sessions: PlanSessionBookingContext[];
};

const planColumns = {
  id: planTable.id,
  tenantId: planTable.tenantId,
  patientId: planTable.patientId,
  treatmentId: planTable.treatmentId,
  treatmentName: planTable.treatmentName,
  treatmentCode: planTable.treatmentCode,
  treatmentSourceIdentity: planTable.treatmentSourceIdentity,
  sessionStructure: planTable.sessionStructure,
  totalSessions: planTable.totalSessions,
  statusOverride: planTable.statusOverride,
  legacySourceIdentity: planTable.legacySourceIdentity,
  legacySourceSystem: planTable.legacySourceSystem,
  legacySourceKey: planTable.legacySourceKey,
  legacySourceContentHash: planTable.legacySourceContentHash,
  sourceImportBatchId: planTable.sourceImportBatchId,
  legacyVisitId: planTable.legacyVisitId,
  legacyVisitNumber: planTable.legacyVisitNumber,
  importBatchId: planTable.importBatchId,
  createdOn: planTable.createdOn,
  modifiedOn: planTable.modifiedOn,
};

const sessionColumns = {
  id: sessionTable.id,
  tenantId: sessionTable.tenantId,
  patientTreatmentPlanId: sessionTable.patientTreatmentPlanId,
  treatmentSessionId: sessionTable.treatmentSessionId,
  sessionNumber: sessionTable.sessionNumber,
  label: sessionTable.label,
  procedure: sessionTable.procedure,
  durationMinutes: sessionTable.durationMinutes,
  setupMinutes: sessionTable.setupMinutes,
  cleaningMinutes: sessionTable.cleaningMinutes,
  preparation: sessionTable.preparation,
  warning: sessionTable.warning,
  equipment: sessionTable.equipment,
  roomType: sessionTable.roomType,
  therapistSkill: sessionTable.therapistSkill,
  legacyConductionNote: sessionTable.legacyConductionNote,
  completionStatus: sessionTable.completionStatus,
  completionSource: sessionTable.completionSource,
  completedVisitId: sessionTable.completedVisitId,
  completedAt: sessionTable.completedAt,
  createdOn: sessionTable.createdOn,
  modifiedOn: sessionTable.modifiedOn,
};

const templateSnapshotColumns = {
  id: templateTable.id,
  label: templateTable.label,
  warning: templateTable.warning,
  roomType: templateTable.roomType,
  equipment: templateTable.equipment,
  procedure: templateTable.procedure,
  preparation: templateTable.preparation,
  setupMinutes: templateTable.setupMinutes,
  sessionNumber: templateTable.sessionNumber,
  therapistSkill: templateTable.therapistSkill,
  durationMinutes: templateTable.durationMinutes,
  cleaningMinutes: templateTable.cleaningMinutes,
};

type TreatmentSnapshot = {
  id: number;
  name: string;
  code: string;
  tenantId: string;
  sessionStructure: 'REPEATABLE' | 'SEQUENCED';
  defaultTotalSessions: number | null;
  legacySourceIdentity: string | null;
};

type SessionSnapshot = {
  id: number;
  label: string;
  warning: string | null;
  roomType: string | null;
  equipment: string | null;
  procedure: string;
  preparation: string | null;
  setupMinutes: number | null;
  sessionNumber: number;
  therapistSkill: string | null;
  durationMinutes: number | null;
  cleaningMinutes: number | null;
};

function deriveStatus(
  plan: Pick<PatientTreatmentPlanRecord, 'statusOverride'>,
  sessions: PatientTreatmentPlanSession[]
): PatientTreatmentPlanStatus {
  if (plan.statusOverride === 'STOPPED') return 'STOPPED';
  if (sessions.every((session) => session.completionStatus === 'PENDING')) return 'PENDING';
  if (
    sessions.length > 0 &&
    sessions.every((session) => session.completionStatus === 'COMPLETED')
  ) {
    return 'COMPLETED';
  }
  return 'IN_PROGRESS';
}

function withAvailability(
  session: PatientTreatmentPlanSession,
  isReserved: boolean,
  reservedAppointment: PatientTreatmentPlanSessionReservedAppointment | null
): PatientTreatmentPlanReadSession {
  const isCompleted = session.completionStatus === 'COMPLETED';
  const unavailableReason = isCompleted ? 'COMPLETED' : isReserved ? 'RESERVED' : null;

  return {
    ...session,
    isReserved,
    isBookable: unavailableReason === null,
    unavailableReason,
    reservedAppointment,
  };
}

async function getCurrentByPatientId(
  patientId: number,
  tenantId: string
): Promise<PatientTreatmentPlan[]> {
  const plans = await db
    .select(planColumns)
    .from(planTable)
    .innerJoin(
      patientTable,
      and(
        eq(patientTable.id, planTable.patientId),
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(planTable.patientId, patientId),
        eq(planTable.tenantId, tenantId),
        eq(planTable.isDeleted, false),
        isNull(planTable.statusOverride)
      )
    )
    .orderBy(asc(planTable.createdOn), asc(planTable.id));

  if (plans.length === 0) return [];

  const rows = await db
    .select({
      ...sessionColumns,
      reservationId: reservationTable.id,
      reservedBookingNumber: appointmentTable.bookingNumber,
      reservedSlotDate: appointmentTable.slotDate,
      reservedStartTime: appointmentTable.startTime,
      reservedEndTime: appointmentTable.endTime,
    })
    .from(sessionTable)
    .leftJoin(
      reservationTable,
      and(
        eq(reservationTable.patientTreatmentPlanSessionId, sessionTable.id),
        eq(reservationTable.tenantId, tenantId),
        eq(reservationTable.isDeleted, false)
      )
    )
    .leftJoin(
      appointmentTable,
      and(
        eq(appointmentTable.id, reservationTable.appointmentId),
        eq(appointmentTable.tenantId, tenantId),
        eq(appointmentTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(sessionTable.tenantId, tenantId),
        eq(sessionTable.isDeleted, false),
        inArray(
          sessionTable.patientTreatmentPlanId,
          plans.map((plan) => plan.id)
        )
      )
    )
    .orderBy(
      asc(sessionTable.patientTreatmentPlanId),
      asc(sessionTable.sessionNumber),
      asc(sessionTable.id)
    );

  const sessionsByPlan = new Map<number, PatientTreatmentPlanReadSession[]>();

  for (const {
    reservationId,
    reservedBookingNumber,
    reservedSlotDate,
    reservedStartTime,
    reservedEndTime,
    ...session
  } of rows) {
    const sessions = sessionsByPlan.get(session.patientTreatmentPlanId) ?? [];
    const reservedAppointment =
      reservationId !== null && reservedBookingNumber !== null && reservedSlotDate !== null
        ? {
            bookingNumber: reservedBookingNumber,
            slotDate: reservedSlotDate,
            startTime: reservedStartTime,
            endTime: reservedEndTime,
          }
        : null;
    sessions.push(withAvailability(session, reservationId !== null, reservedAppointment));
    sessionsByPlan.set(session.patientTreatmentPlanId, sessions);
  }

  const currentPlans: PatientTreatmentPlan[] = [];

  for (const plan of plans) {
    const sessions = sessionsByPlan.get(plan.id) ?? [];
    const completedSessions = sessions.filter(
      (session) => session.completionStatus === 'COMPLETED'
    ).length;
    const status = deriveStatus(plan, sessions);

    if (status === 'PENDING' || status === 'IN_PROGRESS') {
      currentPlans.push({ ...plan, status, completedSessions, sessions });
    }
  }

  return currentPlans;
}

async function getPlanSessionForBooking(
  planId: number,
  sessionId: number,
  patientId: number,
  tenantId: string,
  tx: PatientTreatmentPlanTransaction
): Promise<PlanSessionBookingContext | undefined> {
  const [context] = await tx
    .select({
      tenantId: planTable.tenantId,
      patientId: planTable.patientId,
      treatmentId: planTable.treatmentId,
      treatmentName: planTable.treatmentName,
      treatmentCode: planTable.treatmentCode,
      treatmentSourceIdentity: planTable.treatmentSourceIdentity,
      sessionStructure: planTable.sessionStructure,
      totalSessions: planTable.totalSessions,
      patientTreatmentPlanId: planTable.id,
      patientTreatmentPlanSessionId: sessionTable.id,
      treatmentSessionId: sessionTable.treatmentSessionId,
      sessionNumber: sessionTable.sessionNumber,
      label: sessionTable.label,
      procedure: sessionTable.procedure,
      durationMinutes: sessionTable.durationMinutes,
      setupMinutes: sessionTable.setupMinutes,
      cleaningMinutes: sessionTable.cleaningMinutes,
      preparation: sessionTable.preparation,
      warning: sessionTable.warning,
      equipment: sessionTable.equipment,
      roomType: sessionTable.roomType,
      therapistSkill: sessionTable.therapistSkill,
      legacyConductionNote: sessionTable.legacyConductionNote,
    })
    .from(sessionTable)
    .innerJoin(
      planTable,
      and(
        eq(planTable.id, sessionTable.patientTreatmentPlanId),
        eq(planTable.tenantId, tenantId),
        eq(planTable.isDeleted, false)
      )
    )
    .innerJoin(
      patientTable,
      and(
        eq(patientTable.id, planTable.patientId),
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(planTable.id, planId),
        eq(planTable.patientId, patientId),
        isNull(planTable.statusOverride),
        eq(sessionTable.id, sessionId),
        eq(sessionTable.tenantId, tenantId),
        eq(sessionTable.completionStatus, 'PENDING'),
        eq(sessionTable.isDeleted, false)
      )
    )
    .for('update', { of: sessionTable })
    .limit(1);

  if (!context) return undefined;

  const [reservation] = await tx
    .select({ id: reservationTable.id })
    .from(reservationTable)
    .where(
      and(
        eq(reservationTable.patientTreatmentPlanSessionId, sessionId),
        eq(reservationTable.tenantId, tenantId),
        eq(reservationTable.isDeleted, false)
      )
    )
    .limit(1);

  return reservation ? undefined : context;
}

async function hasCurrentPlanForBooking(
  patientId: number,
  tenantId: string,
  tx: PatientTreatmentPlanTransaction
): Promise<boolean> {
  const [patient] = await tx
    .select({ id: patientTable.id })
    .from(patientTable)
    .where(
      and(
        eq(patientTable.id, patientId),
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .for('update')
    .limit(1);

  if (!patient) return false;

  const [currentPlan] = await tx
    .select({ id: planTable.id })
    .from(planTable)
    .leftJoin(
      sessionTable,
      and(
        eq(sessionTable.patientTreatmentPlanId, planTable.id),
        eq(sessionTable.tenantId, tenantId),
        eq(sessionTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(planTable.patientId, patientId),
        eq(planTable.tenantId, tenantId),
        eq(planTable.isDeleted, false),
        isNull(planTable.statusOverride),
        or(isNull(sessionTable.id), eq(sessionTable.completionStatus, 'PENDING'))
      )
    )
    .limit(1);

  return currentPlan !== undefined;
}

function snapshotSessionValues(
  tenantId: string,
  patientTreatmentPlanId: number,
  template: SessionSnapshot,
  sessionNumber: number
) {
  return {
    tenantId,
    patientTreatmentPlanId,
    treatmentSessionId: template.id,
    sessionNumber,
    label: template.label,
    procedure: template.procedure,
    durationMinutes: template.durationMinutes,
    setupMinutes: template.setupMinutes,
    cleaningMinutes: template.cleaningMinutes,
    preparation: template.preparation,
    warning: template.warning,
    equipment: template.equipment,
    roomType: template.roomType,
    therapistSkill: template.therapistSkill,
  };
}

function createdBookingContext(
  plan: TreatmentSnapshot & { patientId: number; planId: number; totalSessions: number },
  session: PatientTreatmentPlanSession
): PlanSessionBookingContext {
  return {
    tenantId: plan.tenantId,
    patientId: plan.patientId,
    treatmentId: plan.id,
    treatmentName: plan.name,
    treatmentCode: plan.code,
    treatmentSourceIdentity: plan.legacySourceIdentity,
    sessionStructure: plan.sessionStructure,
    totalSessions: plan.totalSessions,
    patientTreatmentPlanId: plan.planId,
    patientTreatmentPlanSessionId: session.id,
    treatmentSessionId: session.treatmentSessionId,
    sessionNumber: session.sessionNumber,
    label: session.label,
    procedure: session.procedure,
    durationMinutes: session.durationMinutes,
    setupMinutes: session.setupMinutes,
    cleaningMinutes: session.cleaningMinutes,
    preparation: session.preparation,
    warning: session.warning,
    equipment: session.equipment,
    roomType: session.roomType,
    therapistSkill: session.therapistSkill,
    legacyConductionNote: session.legacyConductionNote,
  };
}

async function createPlanFromTreatment(
  input: CatalogueAssignment,
  tx: PatientTreatmentPlanTransaction
): Promise<CreatedPatientTreatmentPlan> {
  const [patient] = await tx
    .select({ id: patientTable.id })
    .from(patientTable)
    .where(
      and(
        eq(patientTable.id, input.patientId),
        eq(patientTable.tenantId, input.tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .for('update')
    .limit(1);

  if (!patient) throw new Error('Patient not found');

  const [treatment] = await tx
    .select({
      id: treatmentTable.id,
      name: treatmentTable.name,
      code: treatmentTable.code,
      tenantId: treatmentTable.tenantId,
      sessionStructure: treatmentTable.sessionStructure,
      defaultTotalSessions: treatmentTable.defaultTotalSessions,
      legacySourceIdentity: treatmentTable.legacySourceIdentity,
    })
    .from(treatmentTable)
    .where(
      and(
        eq(treatmentTable.id, input.treatmentId),
        eq(treatmentTable.tenantId, input.tenantId),
        eq(treatmentTable.isDeleted, false)
      )
    )
    .for('update')
    .limit(1);

  if (!treatment) throw new Error('Treatment not found');

  const templates = await tx
    .select(templateSnapshotColumns)
    .from(templateTable)
    .where(
      and(
        eq(templateTable.treatmentId, treatment.id),
        eq(templateTable.tenantId, input.tenantId),
        eq(templateTable.isDeleted, false)
      )
    )
    .orderBy(asc(templateTable.sessionNumber), asc(templateTable.id))
    .for('update');

  if (templates.length === 0) throw new Error('Treatment has no Session templates');

  let totalSessions: number;

  if (treatment.sessionStructure === 'REPEATABLE') {
    totalSessions = input.totalSessions ?? treatment.defaultTotalSessions ?? 0;
    if (!Number.isInteger(totalSessions) || totalSessions <= 0) {
      throw new Error('Repeatable Treatment requires a positive total Sessions count');
    }
    if (templates.length !== 1) {
      throw new Error('Repeatable Treatment requires exactly one Session template');
    }
  } else {
    if (input.totalSessions !== undefined) {
      throw new Error('Sequenced Treatment derives its count from Session templates');
    }
    totalSessions = templates.length;
  }

  const [createdPlan] = await tx
    .insert(planTable)
    .values({
      tenantId: input.tenantId,
      patientId: input.patientId,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      treatmentCode: treatment.code,
      treatmentSourceIdentity: treatment.legacySourceIdentity,
      sessionStructure: treatment.sessionStructure,
      totalSessions,
    })
    .returning({ id: planTable.id });

  let sessionValues: ReturnType<typeof snapshotSessionValues>[];

  if (treatment.sessionStructure === 'REPEATABLE') {
    sessionValues = Array.from({ length: totalSessions }, (_, index) =>
      snapshotSessionValues(input.tenantId, createdPlan.id, templates[0], index + 1)
    );
  } else {
    sessionValues = templates.map((template) =>
      snapshotSessionValues(input.tenantId, createdPlan.id, template, template.sessionNumber)
    );
  }

  const createdSessions = await tx
    .insert(sessionTable)
    .values(sessionValues)
    .returning(sessionColumns);
  const planSnapshot = {
    ...treatment,
    patientId: input.patientId,
    planId: createdPlan.id,
    totalSessions,
  };

  return {
    totalSessions,
    patientTreatmentPlanId: createdPlan.id,
    sessions: createdSessions.map((session) => createdBookingContext(planSnapshot, session)),
  };
}

async function reserveSession(
  planSessionId: number,
  appointmentId: number,
  tenantId: string,
  tx: PatientTreatmentPlanTransaction
): Promise<void> {
  const [session] = await tx
    .select({ planId: sessionTable.patientTreatmentPlanId })
    .from(sessionTable)
    .where(
      and(
        eq(sessionTable.id, planSessionId),
        eq(sessionTable.tenantId, tenantId),
        eq(sessionTable.isDeleted, false)
      )
    )
    .limit(1);
  const [appointment] = await tx
    .select({
      planId: appointmentTable.patientTreatmentPlanId,
      sessionId: appointmentTable.patientTreatmentPlanSessionId,
    })
    .from(appointmentTable)
    .where(
      and(
        eq(appointmentTable.id, appointmentId),
        eq(appointmentTable.tenantId, tenantId),
        eq(appointmentTable.isDeleted, false)
      )
    )
    .limit(1);

  if (
    !session ||
    !appointment ||
    appointment.planId !== session.planId ||
    appointment.sessionId !== planSessionId
  ) {
    throw new Error('Appointment and Patient Treatment Plan Session do not match');
  }

  await tx.insert(reservationTable).values({
    tenantId,
    appointmentId,
    patientTreatmentPlanSessionId: planSessionId,
  });
}

async function releaseReservationForAppointment(
  appointmentId: number,
  tenantId: string,
  tx: PatientTreatmentPlanTransaction
): Promise<void> {
  const releasedOn = new Date();
  await tx
    .update(reservationTable)
    .set({ isDeleted: true, modifiedOn: releasedOn, deletedOn: releasedOn })
    .where(
      and(
        eq(reservationTable.appointmentId, appointmentId),
        eq(reservationTable.tenantId, tenantId),
        eq(reservationTable.isDeleted, false)
      )
    );
}

async function completeSessionForVisit(
  visitId: number,
  appointmentId: number,
  tenantId: string,
  tx: PatientTreatmentPlanTransaction
): Promise<void> {
  const [visit] = await tx
    .select({ patientId: visitTable.patientId, completedAt: visitTable.completedAt })
    .from(visitTable)
    .where(
      and(
        eq(visitTable.id, visitId),
        eq(visitTable.appointmentId, appointmentId),
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.status, 'COMPLETED'),
        eq(visitTable.isDeleted, false)
      )
    )
    .limit(1);
  const [appointment] = await tx
    .select({
      patientId: appointmentTable.patientId,
      bookingPath: appointmentTable.bookingPath,
      planId: appointmentTable.patientTreatmentPlanId,
      sessionId: appointmentTable.patientTreatmentPlanSessionId,
    })
    .from(appointmentTable)
    .where(
      and(
        eq(appointmentTable.id, appointmentId),
        eq(appointmentTable.tenantId, tenantId),
        eq(appointmentTable.isDeleted, false)
      )
    )
    .limit(1);

  if (
    !visit ||
    !visit.completedAt ||
    !appointment ||
    appointment.bookingPath !== 'PROCEDURE' ||
    visit.patientId !== appointment.patientId
  ) {
    return;
  }
  if (appointment.planId === null || appointment.sessionId === null) return;

  const [session] = await tx
    .select({
      id: sessionTable.id,
      completionStatus: sessionTable.completionStatus,
    })
    .from(sessionTable)
    .innerJoin(
      planTable,
      and(
        eq(planTable.id, sessionTable.patientTreatmentPlanId),
        eq(planTable.patientId, appointment.patientId),
        eq(planTable.tenantId, tenantId),
        eq(planTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(sessionTable.id, appointment.sessionId),
        eq(sessionTable.patientTreatmentPlanId, appointment.planId),
        eq(sessionTable.tenantId, tenantId),
        eq(sessionTable.isDeleted, false)
      )
    )
    .for('update', { of: sessionTable })
    .limit(1);

  if (!session || session.completionStatus === 'COMPLETED') return;

  await tx
    .update(sessionTable)
    .set({
      completionStatus: 'COMPLETED',
      completionSource: 'VISIT',
      completedVisitId: visitId,
      completedAt: visit.completedAt,
      modifiedOn: visit.completedAt,
    })
    .where(
      and(
        eq(sessionTable.id, session.id),
        eq(sessionTable.tenantId, tenantId),
        eq(sessionTable.completionStatus, 'PENDING'),
        eq(sessionTable.isDeleted, false)
      )
    );
}

export const patientTreatmentPlanRepository = {
  reserveSession,
  createPlanFromTreatment,
  getCurrentByPatientId,
  hasCurrentPlanForBooking,
  completeSessionForVisit,
  getPlanSessionForBooking,
  releaseReservationForAppointment,
};
