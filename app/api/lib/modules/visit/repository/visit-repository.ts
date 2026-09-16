import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { user as userTable } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import {
  visit as visitTable,
  visitNumberCounter as visitNumberCounterTable,
  visitQueueTokenCounter as visitQueueTokenCounterTable,
} from '@/app/db/schema/visit';
import {
  treatment as treatmentTable,
  treatmentSession as treatmentSessionTable,
} from '@/app/db/schema/treatment';
import { visitType as visitTypeTable } from '@/app/db/schema/visit-type';
import type { AppointmentStatusCategory } from '../../appointment-status/schemas/appointment-status-schema';
import { visitDocumentRepository } from '../../visit-document/repository/visit-document-repository';
import { AppointmentStatusNotConfiguredError } from '../errors/appointment-status-not-configured-error';
import {
  formatVisitDate,
  type ValidatedCheckInVisitData,
  type Visit,
  type VisitListParams,
  type VisitStatus,
} from '../schemas/visit-schema';
import { formatVisitNumber } from './visit-number';

type SelectExecutor = Pick<typeof db, 'select'>;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const ACTIVE_VISIT_STATUSES: VisitStatus[] = ['CHECKED_IN', 'IN_CONSULTATION'];

const visitColumns = {
  id: visitTable.id,
  status: visitTable.status,
  remarks: visitTable.remarks,
  tenantId: visitTable.tenantId,
  visitDate: visitTable.visitDate,
  createdOn: visitTable.createdOn,
  completedAt: visitTable.completedAt,
  modifiedOn: visitTable.modifiedOn,
  queueToken: visitTable.queueToken,
  checkedInAt: visitTable.checkedInAt,
  cancelledAt: visitTable.cancelledAt,
  visitNumber: visitTable.visitNumber,
  chiefComplaint: visitTable.chiefComplaint,
  cancellationReason: visitTable.cancellationReason,
  consultationStartedAt: visitTable.consultationStartedAt,
  patient: {
    id: patientTable.id,
    mrn: patientTable.mrn,
    phone: patientTable.phone,
    lastName: patientTable.lastName,
    firstName: patientTable.firstName,
  },
  doctor: {
    id: doctorTable.id,
    name: userTable.name,
  },
  visitType: {
    id: visitTypeTable.id,
    name: visitTypeTable.name,
    code: visitTypeTable.code,
  },
  appointment: {
    id: appointmentTable.id,
    bookingNumber: appointmentTable.bookingNumber,
  },
  treatment: {
    id: treatmentTable.id,
    name: treatmentTable.name,
    code: treatmentTable.code,
  },
  treatmentSession: {
    id: treatmentSessionTable.id,
    label: treatmentSessionTable.label,
    procedure: treatmentSessionTable.procedure,
    sessionNumber: treatmentSessionTable.sessionNumber,
    durationMinutes: treatmentSessionTable.durationMinutes,
    setupMinutes: treatmentSessionTable.setupMinutes,
    cleaningMinutes: treatmentSessionTable.cleaningMinutes,
    roomType: treatmentSessionTable.roomType,
    therapistSkill: treatmentSessionTable.therapistSkill,
  },
};

// A Walk-in Visit has no Appointment, and Drizzle collapses the whole nested
// selection to null when the left join misses — not to an object of nulls.
type VisitRow = {
  status: string;
  visitDate: string;
  appointment: { id: number | null; bookingNumber: string | null } | null;
  treatment: { id: number | null; name: string | null; code: string | null } | null;
  treatmentSession: {
    id: number | null;
    label: string | null;
    procedure: string | null;
    sessionNumber: number | null;
    durationMinutes: number | null;
    setupMinutes: number | null;
    cleaningMinutes: number | null;
    roomType: string | null;
    therapistSkill: string | null;
  } | null;
} & Omit<Visit, 'status' | 'visitDate' | 'appointment' | 'treatment' | 'treatmentSession'>;

function toVisit(row: VisitRow): Visit {
  return {
    ...row,
    status: row.status as VisitStatus,
    visitDate: formatVisitDate(row.visitDate),
    appointment:
      row.appointment?.id != null && row.appointment.bookingNumber != null
        ? { id: row.appointment.id, bookingNumber: row.appointment.bookingNumber }
        : null,
    treatment:
      row.treatment?.id != null && row.treatment.name != null && row.treatment.code != null
        ? { id: row.treatment.id, name: row.treatment.name, code: row.treatment.code }
        : null,
    treatmentSession:
      row.treatmentSession?.id != null &&
      row.treatmentSession.label != null &&
      row.treatmentSession.procedure != null &&
      row.treatmentSession.sessionNumber != null &&
      row.treatmentSession.durationMinutes != null &&
      row.treatmentSession.setupMinutes != null &&
      row.treatmentSession.cleaningMinutes != null
        ? {
            id: row.treatmentSession.id,
            label: row.treatmentSession.label,
            procedure: row.treatmentSession.procedure,
            sessionNumber: row.treatmentSession.sessionNumber,
            durationMinutes: row.treatmentSession.durationMinutes,
            setupMinutes: row.treatmentSession.setupMinutes,
            cleaningMinutes: row.treatmentSession.cleaningMinutes,
            roomType: row.treatmentSession.roomType,
            therapistSkill: row.treatmentSession.therapistSkill,
          }
        : null,
  };
}

// The masters are joined without an isDeleted filter so a Visit still reads
// back after its VisitType is soft-deleted; historical Visits must not vanish.
function visitJoins(executor: SelectExecutor = db) {
  return executor
    .select(visitColumns)
    .from(visitTable)
    .innerJoin(
      patientTable,
      and(eq(patientTable.id, visitTable.patientId), eq(patientTable.tenantId, visitTable.tenantId))
    )
    .innerJoin(
      doctorTable,
      and(eq(doctorTable.id, visitTable.doctorId), eq(doctorTable.tenantId, visitTable.tenantId))
    )
    .innerJoin(userTable, eq(userTable.id, doctorTable.userId))
    .innerJoin(
      visitTypeTable,
      and(
        eq(visitTypeTable.id, visitTable.visitTypeId),
        eq(visitTypeTable.tenantId, visitTable.tenantId)
      )
    )
    .leftJoin(
      appointmentTable,
      and(
        eq(appointmentTable.id, visitTable.appointmentId),
        eq(appointmentTable.tenantId, visitTable.tenantId)
      )
    )
    .leftJoin(
      treatmentTable,
      and(
        eq(treatmentTable.id, visitTable.treatmentId),
        eq(treatmentTable.tenantId, visitTable.tenantId)
      )
    )
    .leftJoin(
      treatmentSessionTable,
      and(
        eq(treatmentSessionTable.id, visitTable.treatmentSessionId),
        eq(treatmentSessionTable.tenantId, visitTable.tenantId)
      )
    );
}

async function getVisitById(
  id: number,
  tenantId: string,
  executor: SelectExecutor = db
): Promise<Visit | undefined> {
  const [row] = await visitJoins(executor)
    .where(
      and(eq(visitTable.id, id), eq(visitTable.tenantId, tenantId), eq(visitTable.isDeleted, false))
    )
    .limit(1);

  return row ? toVisit(row as VisitRow) : undefined;
}

async function getVisits({
  tenantId,
  visitDate,
  doctorId,
  patientId,
  status,
  query,
  page = 1,
  limit = 10,
}: VisitListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(visitTable.visitNumber, `%${trimmedQuery}%`),
        ilike(patientTable.mrn, `%${trimmedQuery}%`),
        ilike(patientTable.firstName, `%${trimmedQuery}%`),
        ilike(patientTable.lastName, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(visitTable.tenantId, tenantId),
    eq(visitTable.isDeleted, false),
    visitDate ? eq(visitTable.visitDate, visitDate) : undefined,
    doctorId ? eq(visitTable.doctorId, doctorId) : undefined,
    patientId ? eq(visitTable.patientId, patientId) : undefined,
    status ? eq(visitTable.status, status) : undefined,
    searchCondition
  );

  // A single day reads as the Doctor's queue, so token order is the clinical
  // order; across days the most recent Visit is the interesting one.
  const ordering = visitDate
    ? [asc(visitTable.queueToken), asc(visitTable.id)]
    : [desc(visitTable.checkedInAt), desc(visitTable.id)];

  const [rows, [{ total }]] = await Promise.all([
    visitJoins()
      .where(whereClause)
      .orderBy(...ordering)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(visitTable)
      .innerJoin(
        patientTable,
        and(
          eq(patientTable.id, visitTable.patientId),
          eq(patientTable.tenantId, visitTable.tenantId)
        )
      )
      .where(whereClause),
  ]);

  return { data: rows.map((row) => toVisit(row as VisitRow)), total };
}

async function findActiveVisitByPatientId(
  tenantId: string,
  patientId: number
): Promise<Visit | undefined> {
  const [row] = await visitJoins()
    .where(
      and(
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.patientId, patientId),
        eq(visitTable.isDeleted, false),
        inArray(visitTable.status, ACTIVE_VISIT_STATUSES)
      )
    )
    .limit(1);

  return row ? toVisit(row as VisitRow) : undefined;
}

async function findNonCancelledVisitByAppointmentId(
  tenantId: string,
  appointmentId: number
): Promise<Visit | undefined> {
  const [row] = await visitJoins()
    .where(
      and(
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.appointmentId, appointmentId),
        eq(visitTable.isDeleted, false),
        sql`${visitTable.status} <> 'CANCELLED'`
      )
    )
    .limit(1);

  return row ? toVisit(row as VisitRow) : undefined;
}

export type VisitClinicalCaptureContext = {
  id: number;
  patientId: number;
  status: VisitStatus;
};

async function getVisitForClinicalCapture(
  tenantId: string,
  visitId: number
): Promise<VisitClinicalCaptureContext | undefined> {
  const [row] = await db
    .select({
      id: visitTable.id,
      patientId: visitTable.patientId,
      status: visitTable.status,
    })
    .from(visitTable)
    .where(
      and(
        eq(visitTable.id, visitId),
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.isDeleted, false)
      )
    )
    .limit(1);

  return row ? { ...row, status: row.status as VisitStatus } : undefined;
}

// Resolves the Tenant's System AppointmentStatus by category — never by the
// mutable code, which Tenants may edit or delete (ADR 0030 / ADR 0023).
async function syncAppointmentStatus(
  tx: Transaction,
  tenantId: string,
  appointmentId: number,
  category: AppointmentStatusCategory,
  extra: { doctorId?: number } = {}
) {
  const [systemStatus] = await tx
    .select({ id: appointmentStatusTable.id })
    .from(appointmentStatusTable)
    .where(
      and(
        eq(appointmentStatusTable.tenantId, tenantId),
        eq(appointmentStatusTable.category, category),
        eq(appointmentStatusTable.isSystem, true),
        eq(appointmentStatusTable.isDeleted, false)
      )
    )
    .limit(1);

  if (!systemStatus) {
    return false;
  }

  await tx
    .update(appointmentTable)
    .set({
      appointmentStatusId: systemStatus.id,
      modifiedOn: new Date(),
      ...(extra.doctorId !== undefined ? { doctorId: extra.doctorId } : {}),
    })
    .where(and(eq(appointmentTable.id, appointmentId), eq(appointmentTable.tenantId, tenantId)));

  return true;
}

export type CheckInVisitRepositoryResult =
  | { success: true; data: Visit }
  | {
      success: false;
      outcome: 'appointment-ineligible' | 'appointment-status-not-configured';
    };

async function runCheckInVisitTransaction(
  data: ValidatedCheckInVisitData
): Promise<CheckInVisitRepositoryResult> {
  return db.transaction(async (tx) => {
    if (data.appointmentId !== undefined) {
      const [appointment] = await tx
        .select({
          doctorId: appointmentTable.doctorId,
          statusCategory: appointmentStatusTable.category,
        })
        .from(appointmentTable)
        .innerJoin(
          appointmentStatusTable,
          and(
            eq(appointmentStatusTable.id, appointmentTable.appointmentStatusId),
            eq(appointmentStatusTable.tenantId, appointmentTable.tenantId)
          )
        )
        .where(
          and(
            eq(appointmentTable.id, data.appointmentId),
            eq(appointmentTable.tenantId, data.tenantId),
            eq(appointmentTable.isDeleted, false)
          )
        )
        .for('update')
        .limit(1);

      // Validation happens before this transaction. Lock and re-check here so
      // cancellation and Check-in cannot both commit for the same Appointment.
      if (
        !appointment ||
        (appointment.statusCategory !== 'SCHEDULED' && appointment.statusCategory !== 'CONFIRMED')
      ) {
        return { success: false, outcome: 'appointment-ineligible' };
      }
    }

    const [numberCounter] = await tx
      .insert(visitNumberCounterTable)
      .values({ tenantId: data.tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: visitNumberCounterTable.tenantId,
        set: { lastNumber: sql`${visitNumberCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: visitNumberCounterTable.lastNumber });

    const [tokenCounter] = await tx
      .insert(visitQueueTokenCounterTable)
      .values({
        tenantId: data.tenantId,
        doctorId: data.doctorId,
        tokenDate: data.visitDate,
        lastNumber: 1,
      })
      .onConflictDoUpdate({
        target: [
          visitQueueTokenCounterTable.tenantId,
          visitQueueTokenCounterTable.doctorId,
          visitQueueTokenCounterTable.tokenDate,
        ],
        set: { lastNumber: sql`${visitQueueTokenCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: visitQueueTokenCounterTable.lastNumber });

    const [createdVisit] = await tx
      .insert(visitTable)
      .values({
        tenantId: data.tenantId,
        visitNumber: formatVisitNumber(numberCounter.lastNumber),
        patientId: data.patientId,
        doctorId: data.doctorId,
        visitTypeId: data.visitTypeId,
        appointmentId: data.appointmentId ?? null,
        status: 'CHECKED_IN',
        visitDate: data.visitDate,
        queueToken: tokenCounter.lastNumber,
        chiefComplaint: data.chiefComplaint ?? null,
        remarks: data.remarks ?? null,
        treatmentId: data.treatmentId ?? null,
        treatmentSessionId: data.treatmentSessionId ?? null,
      })
      .returning({ id: visitTable.id });

    if (data.documents && data.documents.length > 0) {
      await visitDocumentRepository.insertMany(tx, data.tenantId, createdVisit.id, data.documents);
    }

    if (data.appointmentId !== undefined) {
      const synced = await syncAppointmentStatus(
        tx,
        data.tenantId,
        data.appointmentId,
        'CHECKED_IN',
        appointment.doctorId ? {} : { doctorId: data.doctorId }
      );

      if (!synced) {
        // Roll the Check-in back rather than leave the Appointment claiming the
        // Patient never arrived.
        throw new AppointmentStatusNotConfiguredError();
      }
    }

    const created = await getVisitById(createdVisit.id, data.tenantId, tx);

    if (!created) {
      throw new Error('Created Visit could not be read');
    }

    return { success: true, data: created };
  });
}

async function checkInVisit(
  data: ValidatedCheckInVisitData
): Promise<CheckInVisitRepositoryResult> {
  try {
    return await runCheckInVisitTransaction(data);
  } catch (error) {
    if (error instanceof AppointmentStatusNotConfiguredError) {
      return { success: false, outcome: 'appointment-status-not-configured' };
    }

    throw error;
  }
}

export type VisitTransitionResult =
  | { outcome: 'updated'; data: Visit }
  | { outcome: 'not-found' }
  | { outcome: 'invalid-status'; data: Visit }
  | { outcome: 'appointment-status-not-configured' };

type TransitionSpec = {
  from: VisitStatus[];
  to: VisitStatus;
  appointmentCategory?: AppointmentStatusCategory;
  columns: (now: Date) => Partial<typeof visitTable.$inferInsert>;
};

// Every transition is guarded in one transaction: the row is locked, its status
// re-checked, then the Visit and any linked Appointment move together.
async function runTransitionVisitTransaction(
  id: number,
  tenantId: string,
  spec: TransitionSpec
): Promise<VisitTransitionResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: visitTable.id,
        status: visitTable.status,
        appointmentId: visitTable.appointmentId,
      })
      .from(visitTable)
      .where(
        and(
          eq(visitTable.id, id),
          eq(visitTable.tenantId, tenantId),
          eq(visitTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) {
      return { outcome: 'not-found' };
    }

    if (!spec.from.includes(existing.status as VisitStatus)) {
      const current = await getVisitById(id, tenantId, tx);

      if (!current) {
        return { outcome: 'not-found' };
      }

      return { outcome: 'invalid-status', data: current };
    }

    const now = new Date();

    await tx
      .update(visitTable)
      .set({ status: spec.to, modifiedOn: now, ...spec.columns(now) })
      .where(and(eq(visitTable.id, id), eq(visitTable.tenantId, tenantId)));

    if (spec.appointmentCategory && existing.appointmentId !== null) {
      const synced = await syncAppointmentStatus(
        tx,
        tenantId,
        existing.appointmentId,
        spec.appointmentCategory
      );

      if (!synced) {
        // Undo the Visit move too — the Visit and its Appointment must never
        // disagree about what happened (ADR 0030).
        throw new AppointmentStatusNotConfiguredError();
      }
    }

    const updated = await getVisitById(id, tenantId, tx);

    if (!updated) {
      throw new Error('Updated Visit could not be read');
    }

    return { outcome: 'updated', data: updated };
  });
}

async function transitionVisit(
  id: number,
  tenantId: string,
  spec: TransitionSpec
): Promise<VisitTransitionResult> {
  try {
    return await runTransitionVisitTransaction(id, tenantId, spec);
  } catch (error) {
    if (error instanceof AppointmentStatusNotConfiguredError) {
      return { outcome: 'appointment-status-not-configured' };
    }

    throw error;
  }
}

async function startConsultation(id: number, tenantId: string): Promise<VisitTransitionResult> {
  return transitionVisit(id, tenantId, {
    from: ['CHECKED_IN'],
    to: 'IN_CONSULTATION',
    columns: (now) => ({ consultationStartedAt: now }),
  });
}

async function completeVisit(id: number, tenantId: string): Promise<VisitTransitionResult> {
  return transitionVisit(id, tenantId, {
    from: ['IN_CONSULTATION'],
    to: 'COMPLETED',
    appointmentCategory: 'COMPLETED',
    columns: (now) => ({ completedAt: now }),
  });
}

// Cancelling returns the Appointment to Scheduled so reception can simply check
// the Patient in again (ADR 0030).
async function cancelVisit(
  id: number,
  tenantId: string,
  cancellationReason: string
): Promise<VisitTransitionResult> {
  return transitionVisit(id, tenantId, {
    from: ['CHECKED_IN', 'IN_CONSULTATION'],
    to: 'CANCELLED',
    appointmentCategory: 'SCHEDULED',
    columns: (now) => ({ cancelledAt: now, cancellationReason }),
  });
}

async function updateVisit(
  id: number,
  tenantId: string,
  data: {
    chiefComplaint?: string;
    remarks?: string;
    treatmentId?: number | null;
    treatmentSessionId?: number | null;
  }
): Promise<Visit | undefined> {
  const [updated] = await db
    .update(visitTable)
    .set({
      chiefComplaint: data.chiefComplaint ?? null,
      remarks: data.remarks ?? null,
      modifiedOn: new Date(),
      ...(data.treatmentId !== undefined
        ? {
            treatmentId: data.treatmentId,
            treatmentSessionId: data.treatmentSessionId,
          }
        : {}),
    })
    .where(
      and(eq(visitTable.id, id), eq(visitTable.tenantId, tenantId), eq(visitTable.isDeleted, false))
    )
    .returning({ id: visitTable.id });

  if (!updated) {
    return undefined;
  }

  return getVisitById(id, tenantId);
}

export type DeleteVisitResult =
  | { outcome: 'deleted'; data: Visit }
  | { outcome: 'not-found' }
  | { outcome: 'appointment-status-not-configured' };

async function runDeleteVisitTransaction(id: number, tenantId: string): Promise<DeleteVisitResult> {
  return db.transaction(async (tx) => {
    const [existingRow] = await tx
      .select({
        id: visitTable.id,
        status: visitTable.status,
        appointmentId: visitTable.appointmentId,
      })
      .from(visitTable)
      .where(
        and(
          eq(visitTable.id, id),
          eq(visitTable.tenantId, tenantId),
          eq(visitTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existingRow) {
      return { outcome: 'not-found' };
    }

    const existing = await getVisitById(id, tenantId, tx);

    if (!existing) {
      return { outcome: 'not-found' };
    }

    const deletedOn = new Date();

    await tx
      .update(visitTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(and(eq(visitTable.id, id), eq(visitTable.tenantId, tenantId)));

    // Deleting an Active Visit must hand its Appointment back, exactly as
    // cancelling does. Otherwise the Appointment is stranded in Checked In with
    // no visible Visit, and Check-in refuses it forever (ADR 0030).
    if (
      existingRow.appointmentId !== null &&
      ACTIVE_VISIT_STATUSES.includes(existingRow.status as VisitStatus)
    ) {
      const synced = await syncAppointmentStatus(
        tx,
        tenantId,
        existingRow.appointmentId,
        'SCHEDULED'
      );

      if (!synced) {
        throw new AppointmentStatusNotConfiguredError();
      }
    }

    return { outcome: 'deleted', data: existing };
  });
}

async function deleteVisit(id: number, tenantId: string): Promise<DeleteVisitResult> {
  try {
    return await runDeleteVisitTransaction(id, tenantId);
  } catch (error) {
    if (error instanceof AppointmentStatusNotConfiguredError) {
      return { outcome: 'appointment-status-not-configured' };
    }

    throw error;
  }
}

export const visitRepository = {
  getVisits,
  updateVisit,
  deleteVisit,
  getVisitById,
  checkInVisit,
  cancelVisit,
  completeVisit,
  startConsultation,
  findActiveVisitByPatientId,
  getVisitForClinicalCapture,
  findNonCancelledVisitByAppointmentId,
};
