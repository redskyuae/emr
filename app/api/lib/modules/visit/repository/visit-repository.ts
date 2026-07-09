import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentType as appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { user } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import {
  visitNumberCounter as visitNumberCounterTable,
  visit as visitTable,
} from '@/app/db/schema/visit';
import { visitStatus as visitStatusTable } from '@/app/db/schema/visit-status';
import type { VisitStatusCategory } from '../../visit-status/schemas/visit-status-schema';
import { OpenVisitConflictError } from '../errors/open-visit-conflict-error';
import { PatientInactiveConflictError } from '../errors/patient-inactive-conflict-error';
import { VisitStatusConflictError } from '../errors/visit-status-conflict-error';
import type {
  Visit,
  CreateVisitData,
  UpdateVisitData,
  VisitListParams,
} from '../schemas/visit-schema';
import { formatVisitNumber } from './visit-number';

const OPEN_VISIT_CATEGORIES: VisitStatusCategory[] = ['WAITING', 'IN_PROGRESS'];

const visitColumns = {
  id: visitTable.id,
  tenantId: visitTable.tenantId,
  visitNumber: visitTable.visitNumber,
  patientId: visitTable.patientId,
  patientFirstName: patientTable.firstName,
  patientMiddleName: patientTable.middleName,
  patientLastName: patientTable.lastName,
  patientMrn: patientTable.mrn,
  doctorId: visitTable.doctorId,
  doctorName: user.name,
  appointmentTypeId: visitTable.appointmentTypeId,
  appointmentTypeName: appointmentTypeTable.name,
  appointmentTypeCode: appointmentTypeTable.code,
  appointmentReasonId: visitTable.appointmentReasonId,
  appointmentReasonName: appointmentReasonTable.name,
  appointmentReasonCode: appointmentReasonTable.code,
  statusId: visitTable.statusId,
  statusName: visitStatusTable.name,
  statusCode: visitStatusTable.code,
  statusColor: visitStatusTable.color,
  statusCategory: visitStatusTable.category,
  chiefComplaint: visitTable.chiefComplaint,
  notes: visitTable.notes,
  cancelledReason: visitTable.cancelledReason,
  startedOn: visitTable.startedOn,
  completedOn: visitTable.completedOn,
  cancelledOn: visitTable.cancelledOn,
  createdOn: visitTable.createdOn,
  modifiedOn: visitTable.modifiedOn,
};

type VisitRow = {
  id: number;
  tenantId: string;
  visitNumber: string;
  patientId: number;
  patientFirstName: string;
  patientMiddleName: string | null;
  patientLastName: string;
  patientMrn: string;
  doctorId: number | null;
  doctorName: string | null;
  appointmentTypeId: number;
  appointmentTypeName: string;
  appointmentTypeCode: string;
  appointmentReasonId: number | null;
  appointmentReasonName: string | null;
  appointmentReasonCode: string | null;
  statusId: number;
  statusName: string;
  statusCode: string;
  statusColor: string;
  statusCategory: string;
  chiefComplaint: string | null;
  notes: string | null;
  cancelledReason: string | null;
  startedOn: Date | null;
  completedOn: Date | null;
  cancelledOn: Date | null;
  createdOn: Date;
  modifiedOn: Date;
};

function patientName(
  row: Pick<VisitRow, 'patientFirstName' | 'patientMiddleName' | 'patientLastName'>
) {
  return [row.patientFirstName, row.patientMiddleName, row.patientLastName]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

function toVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    tenantId: row.tenantId,
    visitNumber: row.visitNumber,
    patientId: row.patientId,
    patient: { id: row.patientId, name: patientName(row), mrn: row.patientMrn },
    doctorId: row.doctorId,
    doctor: row.doctorId && row.doctorName ? { id: row.doctorId, name: row.doctorName } : null,
    appointmentTypeId: row.appointmentTypeId,
    appointmentType: {
      id: row.appointmentTypeId,
      name: row.appointmentTypeName,
      code: row.appointmentTypeCode,
    },
    appointmentReasonId: row.appointmentReasonId,
    appointmentReason:
      row.appointmentReasonId && row.appointmentReasonName
        ? {
            id: row.appointmentReasonId,
            name: row.appointmentReasonName,
            code: row.appointmentReasonCode ?? '',
          }
        : null,
    statusId: row.statusId,
    status: {
      id: row.statusId,
      name: row.statusName,
      code: row.statusCode,
      color: row.statusColor,
      category: row.statusCategory as VisitStatusCategory,
    },
    chiefComplaint: row.chiefComplaint,
    notes: row.notes,
    cancelledReason: row.cancelledReason,
    startedOn: row.startedOn,
    completedOn: row.completedOn,
    cancelledOn: row.cancelledOn,
    createdOn: row.createdOn,
    modifiedOn: row.modifiedOn,
  };
}

function visitJoins() {
  return db
    .select(visitColumns)
    .from(visitTable)
    .innerJoin(patientTable, eq(visitTable.patientId, patientTable.id))
    .leftJoin(doctorTable, eq(visitTable.doctorId, doctorTable.id))
    .leftJoin(user, eq(doctorTable.userId, user.id))
    .innerJoin(appointmentTypeTable, eq(visitTable.appointmentTypeId, appointmentTypeTable.id))
    .leftJoin(appointmentReasonTable, eq(visitTable.appointmentReasonId, appointmentReasonTable.id))
    .innerJoin(visitStatusTable, eq(visitTable.statusId, visitStatusTable.id));
}

async function getVisitById(id: number, tenantId: string): Promise<Visit | undefined> {
  const [visit] = await visitJoins()
    .where(
      and(eq(visitTable.id, id), eq(visitTable.tenantId, tenantId), eq(visitTable.isDeleted, false))
    )
    .limit(1);

  return visit ? toVisit(visit) : undefined;
}

async function findOpenVisitByPatientId(
  tenantId: string,
  patientId: number
): Promise<Visit | undefined> {
  const [visit] = await visitJoins()
    .where(
      and(
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.patientId, patientId),
        eq(visitTable.isDeleted, false),
        inArray(visitStatusTable.category, OPEN_VISIT_CATEGORIES)
      )
    )
    .limit(1);

  return visit ? toVisit(visit) : undefined;
}

async function createVisit(data: CreateVisitData): Promise<Visit> {
  const createdId = await db.transaction(async (tx) => {
    // Lock the patient row so concurrent check-ins for the same patient serialize here,
    // closing the TOCTOU window between the validator's pre-check and this insert. Re-check
    // active/deleted state under the lock too: a concurrent deactivate could otherwise commit
    // between the validator's read and this lock, leaving an inactive Patient checked in.
    const [lockedPatient] = await tx
      .select({ id: patientTable.id })
      .from(patientTable)
      .where(
        and(
          eq(patientTable.id, data.patientId),
          eq(patientTable.tenantId, data.tenantId),
          eq(patientTable.isActive, true),
          eq(patientTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!lockedPatient) {
      throw new PatientInactiveConflictError();
    }

    const [openVisit] = await tx
      .select({ visitNumber: visitTable.visitNumber })
      .from(visitTable)
      .innerJoin(visitStatusTable, eq(visitTable.statusId, visitStatusTable.id))
      .where(
        and(
          eq(visitTable.tenantId, data.tenantId),
          eq(visitTable.patientId, data.patientId),
          eq(visitTable.isDeleted, false),
          inArray(visitStatusTable.category, OPEN_VISIT_CATEGORIES)
        )
      )
      .limit(1);

    if (openVisit) {
      throw new OpenVisitConflictError(openVisit.visitNumber);
    }

    const [counter] = await tx
      .insert(visitNumberCounterTable)
      .values({ tenantId: data.tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: visitNumberCounterTable.tenantId,
        set: { lastNumber: sql`${visitNumberCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: visitNumberCounterTable.lastNumber });

    const [createdVisit] = await tx
      .insert(visitTable)
      .values({
        tenantId: data.tenantId,
        visitNumber: formatVisitNumber(counter.lastNumber),
        patientId: data.patientId,
        doctorId: data.doctorId ?? null,
        appointmentTypeId: data.appointmentTypeId,
        appointmentReasonId: data.appointmentReasonId ?? null,
        statusId: data.statusId,
        chiefComplaint: data.chiefComplaint ?? null,
        notes: data.notes ?? null,
      })
      .returning({ id: visitTable.id });

    return createdVisit.id;
  });

  const created = await getVisitById(createdId, data.tenantId);

  if (!created) {
    throw new Error('Created Visit could not be read');
  }

  return created;
}

async function updateVisit(id: number, data: UpdateVisitData): Promise<Visit | undefined> {
  const [updated] = await db
    .update(visitTable)
    .set({
      doctorId: data.doctorId ?? null,
      appointmentTypeId: data.appointmentTypeId,
      appointmentReasonId: data.appointmentReasonId ?? null,
      chiefComplaint: data.chiefComplaint ?? null,
      notes: data.notes ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(visitTable.id, id),
        eq(visitTable.tenantId, data.tenantId),
        eq(visitTable.isDeleted, false),
        // Guards against a concurrent complete/cancel making the Visit terminal
        // between validation and this write: only the request that observed the
        // current status wins the edit, so a stale edit can't be applied on top
        // of a Visit that has since become Completed or Cancelled.
        eq(visitTable.statusId, data.expectedStatusId)
      )
    )
    .returning({ id: visitTable.id });

  if (updated) {
    return getVisitById(updated.id, data.tenantId);
  }

  const stillExists = await getVisitById(id, data.tenantId);

  if (stillExists) {
    throw new VisitStatusConflictError();
  }

  return undefined;
}

type VisitTransition = {
  statusId: number;
  expectedStatusId: number;
  timestampField: 'startedOn' | 'completedOn' | 'cancelledOn';
  cancelledReason?: string;
};

async function updateVisitStatusTransition(
  id: number,
  tenantId: string,
  transition: VisitTransition
): Promise<Visit | undefined> {
  const now = new Date();
  const timestampUpdate: Partial<typeof visitTable.$inferInsert> = {};

  if (transition.timestampField === 'startedOn') {
    timestampUpdate.startedOn = now;
  } else if (transition.timestampField === 'completedOn') {
    timestampUpdate.completedOn = now;
  } else {
    timestampUpdate.cancelledOn = now;
  }

  const [updated] = await db
    .update(visitTable)
    .set({
      statusId: transition.statusId,
      cancelledReason: transition.cancelledReason ?? null,
      modifiedOn: now,
      ...timestampUpdate,
    })
    .where(
      and(
        eq(visitTable.id, id),
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.isDeleted, false),
        // Guards against a second transition (e.g. cancel) racing a first (e.g.
        // complete) on the same Visit: only the request that observed the current
        // status wins the write, closing the window that could otherwise mix a
        // terminal statusId with the other transition's timestamp/reason.
        eq(visitTable.statusId, transition.expectedStatusId)
      )
    )
    .returning({ id: visitTable.id });

  if (updated) {
    return getVisitById(updated.id, tenantId);
  }

  const stillExists = await getVisitById(id, tenantId);

  if (stillExists) {
    throw new VisitStatusConflictError();
  }

  return undefined;
}

async function deleteVisit(id: number, tenantId: string): Promise<Visit | undefined> {
  const existingVisit = await getVisitById(id, tenantId);

  if (!existingVisit) {
    return undefined;
  }

  const deletedOn = new Date();
  const [deletedVisit] = await db
    .update(visitTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(eq(visitTable.id, id), eq(visitTable.tenantId, tenantId), eq(visitTable.isDeleted, false))
    )
    .returning({ id: visitTable.id });

  return deletedVisit ? existingVisit : undefined;
}

async function getVisits({
  tenantId,
  page = 1,
  limit = 10,
  query,
  statusId,
  statusCategory,
  doctorId,
  patientId,
  sortOrder = 'desc',
}: VisitListParams): Promise<{ data: Visit[]; total: number }> {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(visitTable.visitNumber, `%${trimmedQuery}%`),
        ilike(patientTable.firstName, `%${trimmedQuery}%`),
        ilike(patientTable.lastName, `%${trimmedQuery}%`),
        ilike(patientTable.mrn, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(visitTable.tenantId, tenantId),
    eq(visitTable.isDeleted, false),
    searchCondition,
    statusId === undefined ? undefined : eq(visitTable.statusId, statusId),
    statusCategory === undefined ? undefined : eq(visitStatusTable.category, statusCategory),
    doctorId === undefined ? undefined : eq(visitTable.doctorId, doctorId),
    patientId === undefined ? undefined : eq(visitTable.patientId, patientId)
  );

  const [data, [{ total }]] = await Promise.all([
    visitJoins()
      .where(whereClause)
      .orderBy(
        sortOrder === 'asc' ? asc(visitTable.createdOn) : desc(visitTable.createdOn),
        asc(visitTable.id)
      )
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(visitTable)
      .innerJoin(patientTable, eq(visitTable.patientId, patientTable.id))
      .innerJoin(visitStatusTable, eq(visitTable.statusId, visitStatusTable.id))
      .where(whereClause),
  ]);

  return { data: data.map(toVisit), total };
}

async function isStatusInUse(statusId: number, tenantId: string): Promise<boolean> {
  const [visit] = await db
    .select({ id: visitTable.id })
    .from(visitTable)
    .where(
      and(
        eq(visitTable.statusId, statusId),
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.isDeleted, false)
      )
    )
    .limit(1);

  return Boolean(visit);
}

export const visitRepository = {
  getVisits,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitById,
  isStatusInUse,
  findOpenVisitByPatientId,
  updateVisitStatusTransition,
};
