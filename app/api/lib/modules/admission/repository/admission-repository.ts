import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/app/db';
import {
  admission as admissionTable,
  admissionNumberCounter as admissionNumberCounterTable,
} from '@/app/db/schema/admission';
import { admissionBedTransfer as admissionBedTransferTable } from '@/app/db/schema/admission-bed-transfer';
import { admissionType as admissionTypeTable } from '@/app/db/schema/admission-type';
import { user as userTable } from '@/app/db/schema/auth';
import { bed as bedTable } from '@/app/db/schema/bed';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { patient as patientTable } from '@/app/db/schema/patient';
import { visit as visitTable } from '@/app/db/schema/visit';
import { ward as wardTable } from '@/app/db/schema/ward';
import {
  type Admission,
  type AdmissionBedTransferEntry,
  type AdmissionListParams,
  type AdmissionStatus,
  type DischargeDisposition,
  formatAdmissionDate,
  type ValidatedAdmitPatientData,
} from '../schemas/admission-schema';
import { formatAdmissionNumber } from './admission-number';

type SelectExecutor = Pick<typeof db, 'select'>;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const admissionColumns = {
  id: admissionTable.id,
  status: admissionTable.status,
  remarks: admissionTable.remarks,
  tenantId: admissionTable.tenantId,
  createdOn: admissionTable.createdOn,
  modifiedOn: admissionTable.modifiedOn,
  admittedAt: admissionTable.admittedAt,
  cancelledAt: admissionTable.cancelledAt,
  dischargedAt: admissionTable.dischargedAt,
  admissionNumber: admissionTable.admissionNumber,
  admissionReason: admissionTable.admissionReason,
  dischargeSummary: admissionTable.dischargeSummary,
  cancellationReason: admissionTable.cancellationReason,
  dischargeDisposition: admissionTable.dischargeDisposition,
  expectedDischargeDate: admissionTable.expectedDischargeDate,
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
  admissionType: {
    id: admissionTypeTable.id,
    name: admissionTypeTable.name,
    code: admissionTypeTable.code,
  },
  bed: {
    id: bedTable.id,
    bedNumber: bedTable.bedNumber,
  },
  ward: {
    id: wardTable.id,
    name: wardTable.name,
    code: wardTable.code,
  },
  visit: {
    id: visitTable.id,
    visitNumber: visitTable.visitNumber,
  },
};

// A direct Admission has no source Visit, and Drizzle collapses the whole
// nested selection to null when the left join misses.
type AdmissionRow = {
  status: string;
  expectedDischargeDate: string | null;
  dischargeDisposition: string | null;
  visit: { id: number | null; visitNumber: string | null } | null;
} & Omit<Admission, 'status' | 'expectedDischargeDate' | 'dischargeDisposition' | 'visit'>;

function toAdmission(row: AdmissionRow): Admission {
  return {
    ...row,
    status: row.status as AdmissionStatus,
    dischargeDisposition: (row.dischargeDisposition as DischargeDisposition | null) ?? null,
    expectedDischargeDate: row.expectedDischargeDate
      ? formatAdmissionDate(row.expectedDischargeDate)
      : null,
    visit:
      row.visit?.id != null && row.visit.visitNumber != null
        ? { id: row.visit.id, visitNumber: row.visit.visitNumber }
        : null,
  };
}

// The masters and physical topology are joined without an isDeleted filter so a
// historical Admission still reads back after its AdmissionType, Bed, or Ward is
// soft-deleted; discharge history must not vanish.
function admissionJoins(executor: SelectExecutor = db) {
  return executor
    .select(admissionColumns)
    .from(admissionTable)
    .innerJoin(
      patientTable,
      and(
        eq(patientTable.id, admissionTable.patientId),
        eq(patientTable.tenantId, admissionTable.tenantId)
      )
    )
    .innerJoin(
      doctorTable,
      and(
        eq(doctorTable.id, admissionTable.doctorId),
        eq(doctorTable.tenantId, admissionTable.tenantId)
      )
    )
    .innerJoin(userTable, eq(userTable.id, doctorTable.userId))
    .innerJoin(
      admissionTypeTable,
      and(
        eq(admissionTypeTable.id, admissionTable.admissionTypeId),
        eq(admissionTypeTable.tenantId, admissionTable.tenantId)
      )
    )
    .innerJoin(
      bedTable,
      and(eq(bedTable.id, admissionTable.bedId), eq(bedTable.tenantId, admissionTable.tenantId))
    )
    .innerJoin(
      wardTable,
      and(eq(wardTable.id, bedTable.wardId), eq(wardTable.tenantId, bedTable.tenantId))
    )
    .leftJoin(
      visitTable,
      and(
        eq(visitTable.id, admissionTable.visitId),
        eq(visitTable.tenantId, admissionTable.tenantId)
      )
    );
}

async function getAdmissionById(
  id: number,
  tenantId: string,
  executor: SelectExecutor = db
): Promise<Admission | undefined> {
  const [row] = await admissionJoins(executor)
    .where(
      and(
        eq(admissionTable.id, id),
        eq(admissionTable.tenantId, tenantId),
        eq(admissionTable.isDeleted, false)
      )
    )
    .limit(1);

  return row ? toAdmission(row as AdmissionRow) : undefined;
}

async function getAdmissions({
  tenantId,
  status,
  wardId,
  doctorId,
  patientId,
  query,
  page = 1,
  limit = 10,
}: AdmissionListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(admissionTable.admissionNumber, `%${trimmedQuery}%`),
        ilike(patientTable.mrn, `%${trimmedQuery}%`),
        ilike(patientTable.firstName, `%${trimmedQuery}%`),
        ilike(patientTable.lastName, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(admissionTable.tenantId, tenantId),
    eq(admissionTable.isDeleted, false),
    status ? eq(admissionTable.status, status) : undefined,
    wardId ? eq(bedTable.wardId, wardId) : undefined,
    doctorId ? eq(admissionTable.doctorId, doctorId) : undefined,
    patientId ? eq(admissionTable.patientId, patientId) : undefined,
    searchCondition
  );

  const [rows, [{ total }]] = await Promise.all([
    admissionJoins()
      .where(whereClause)
      .orderBy(desc(admissionTable.admittedAt), desc(admissionTable.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(admissionTable)
      .innerJoin(
        patientTable,
        and(
          eq(patientTable.id, admissionTable.patientId),
          eq(patientTable.tenantId, admissionTable.tenantId)
        )
      )
      .innerJoin(
        bedTable,
        and(eq(bedTable.id, admissionTable.bedId), eq(bedTable.tenantId, admissionTable.tenantId))
      )
      .where(whereClause),
  ]);

  return { data: rows.map((row) => toAdmission(row as AdmissionRow)), total };
}

async function findActiveAdmissionByPatientId(
  tenantId: string,
  patientId: number
): Promise<Admission | undefined> {
  const [row] = await admissionJoins()
    .where(
      and(
        eq(admissionTable.tenantId, tenantId),
        eq(admissionTable.patientId, patientId),
        eq(admissionTable.isDeleted, false),
        eq(admissionTable.status, 'ADMITTED')
      )
    )
    .limit(1);

  return row ? toAdmission(row as AdmissionRow) : undefined;
}

const fromBedTable = alias(bedTable, 'from_bed');
const toBedTable = alias(bedTable, 'to_bed');

async function getBedTransfersByAdmissionId(
  tenantId: string,
  admissionId: number
): Promise<AdmissionBedTransferEntry[]> {
  return db
    .select({
      id: admissionBedTransferTable.id,
      reason: admissionBedTransferTable.reason,
      transferredAt: admissionBedTransferTable.transferredAt,
      fromBed: {
        id: fromBedTable.id,
        bedNumber: fromBedTable.bedNumber,
      },
      toBed: {
        id: toBedTable.id,
        bedNumber: toBedTable.bedNumber,
      },
    })
    .from(admissionBedTransferTable)
    .innerJoin(fromBedTable, eq(fromBedTable.id, admissionBedTransferTable.fromBedId))
    .innerJoin(toBedTable, eq(toBedTable.id, admissionBedTransferTable.toBedId))
    .where(
      and(
        eq(admissionBedTransferTable.tenantId, tenantId),
        eq(admissionBedTransferTable.admissionId, admissionId),
        eq(admissionBedTransferTable.isDeleted, false)
      )
    )
    .orderBy(asc(admissionBedTransferTable.transferredAt), asc(admissionBedTransferTable.id));
}

export type AdmissionClinicalCaptureContext = {
  id: number;
  patientId: number;
  status: AdmissionStatus;
};

async function getAdmissionForClinicalCapture(
  tenantId: string,
  admissionId: number
): Promise<AdmissionClinicalCaptureContext | undefined> {
  const [row] = await db
    .select({
      id: admissionTable.id,
      patientId: admissionTable.patientId,
      status: admissionTable.status,
    })
    .from(admissionTable)
    .where(
      and(
        eq(admissionTable.id, admissionId),
        eq(admissionTable.tenantId, tenantId),
        eq(admissionTable.isDeleted, false)
      )
    )
    .limit(1);

  return row ? { ...row, status: row.status as AdmissionStatus } : undefined;
}

// Occupying is a guarded UPDATE (ADR 0033): the status list in the WHERE clause
// means zero updated rows when the bed was taken or made unavailable after
// validation, which the caller turns into a clean conflict instead of a race.
async function occupyBed(tx: Transaction, tenantId: string, bedId: number): Promise<boolean> {
  const updated = await tx
    .update(bedTable)
    .set({ status: 'OCCUPIED', modifiedOn: new Date() })
    .where(
      and(
        eq(bedTable.id, bedId),
        eq(bedTable.tenantId, tenantId),
        eq(bedTable.isDeleted, false),
        or(eq(bedTable.status, 'AVAILABLE'), eq(bedTable.status, 'RESERVED'))
      )
    )
    .returning({ id: bedTable.id });

  return updated.length > 0;
}

async function releaseBed(tx: Transaction, tenantId: string, bedId: number): Promise<void> {
  await tx
    .update(bedTable)
    .set({ status: 'AVAILABLE', modifiedOn: new Date() })
    .where(
      and(
        eq(bedTable.id, bedId),
        eq(bedTable.tenantId, tenantId),
        eq(bedTable.isDeleted, false),
        eq(bedTable.status, 'OCCUPIED')
      )
    );
}

export type AdmitPatientRepositoryResult =
  { success: true; data: Admission } | { success: false; outcome: 'bed-not-available' };

class BedNotAvailableError extends Error {
  constructor() {
    super('Bed is not available for admission');
    this.name = 'BedNotAvailableError';
  }
}

async function runAdmitPatientTransaction(
  data: ValidatedAdmitPatientData
): Promise<AdmitPatientRepositoryResult> {
  return db.transaction(async (tx) => {
    const [numberCounter] = await tx
      .insert(admissionNumberCounterTable)
      .values({ tenantId: data.tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: admissionNumberCounterTable.tenantId,
        set: { lastNumber: sql`${admissionNumberCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: admissionNumberCounterTable.lastNumber });

    const occupied = await occupyBed(tx, data.tenantId, data.bedId);

    if (!occupied) {
      // Roll back the counter increment too — numbers may gap, but not because
      // of a bed race the caller retries immediately.
      throw new BedNotAvailableError();
    }

    const [createdAdmission] = await tx
      .insert(admissionTable)
      .values({
        tenantId: data.tenantId,
        admissionNumber: formatAdmissionNumber(numberCounter.lastNumber),
        patientId: data.patientId,
        doctorId: data.doctorId,
        admissionTypeId: data.admissionTypeId,
        bedId: data.bedId,
        visitId: data.visitId ?? null,
        status: 'ADMITTED',
        admissionReason: data.admissionReason ?? null,
        remarks: data.remarks ?? null,
        expectedDischargeDate: data.expectedDischargeDate ?? null,
      })
      .returning({ id: admissionTable.id });

    const created = await getAdmissionById(createdAdmission.id, data.tenantId, tx);

    if (!created) {
      throw new Error('Created Admission could not be read');
    }

    return { success: true, data: created };
  });
}

async function admitPatient(
  data: ValidatedAdmitPatientData
): Promise<AdmitPatientRepositoryResult> {
  try {
    return await runAdmitPatientTransaction(data);
  } catch (error) {
    if (error instanceof BedNotAvailableError) {
      return { success: false, outcome: 'bed-not-available' };
    }

    throw error;
  }
}

export type TransferBedResult =
  | { outcome: 'transferred'; data: Admission }
  | { outcome: 'not-found' }
  | { outcome: 'invalid-status'; data: Admission }
  | { outcome: 'same-bed'; data: Admission }
  | { outcome: 'bed-not-available' };

async function runTransferBedTransaction(
  id: number,
  tenantId: string,
  toBedId: number,
  reason: string | undefined
): Promise<TransferBedResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: admissionTable.id,
        bedId: admissionTable.bedId,
        status: admissionTable.status,
      })
      .from(admissionTable)
      .where(
        and(
          eq(admissionTable.id, id),
          eq(admissionTable.tenantId, tenantId),
          eq(admissionTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) {
      return { outcome: 'not-found' };
    }

    if (existing.status !== 'ADMITTED') {
      const current = await getAdmissionById(id, tenantId, tx);

      if (!current) {
        return { outcome: 'not-found' };
      }

      return { outcome: 'invalid-status', data: current };
    }

    if (existing.bedId === toBedId) {
      const current = await getAdmissionById(id, tenantId, tx);

      if (!current) {
        return { outcome: 'not-found' };
      }

      return { outcome: 'same-bed', data: current };
    }

    const occupied = await occupyBed(tx, tenantId, toBedId);

    if (!occupied) {
      throw new BedNotAvailableError();
    }

    await releaseBed(tx, tenantId, existing.bedId);

    const now = new Date();

    await tx
      .update(admissionTable)
      .set({ bedId: toBedId, modifiedOn: now })
      .where(and(eq(admissionTable.id, id), eq(admissionTable.tenantId, tenantId)));

    await tx.insert(admissionBedTransferTable).values({
      tenantId,
      admissionId: id,
      fromBedId: existing.bedId,
      toBedId,
      reason: reason ?? null,
      transferredAt: now,
    });

    const updated = await getAdmissionById(id, tenantId, tx);

    if (!updated) {
      throw new Error('Transferred Admission could not be read');
    }

    return { outcome: 'transferred', data: updated };
  });
}

async function transferBed(
  id: number,
  tenantId: string,
  toBedId: number,
  reason: string | undefined
): Promise<TransferBedResult> {
  try {
    return await runTransferBedTransaction(id, tenantId, toBedId, reason);
  } catch (error) {
    if (error instanceof BedNotAvailableError) {
      return { outcome: 'bed-not-available' };
    }

    throw error;
  }
}

export type AdmissionTransitionResult =
  | { outcome: 'updated'; data: Admission }
  | { outcome: 'not-found' }
  | { outcome: 'invalid-status'; data: Admission };

type TransitionColumns = (now: Date) => Partial<typeof admissionTable.$inferInsert>;

// Ending an Admission and freeing its Bed move together in one transaction: the
// row is locked, its status re-checked, then both tables are written (ADR 0033).
async function endAdmission(
  id: number,
  tenantId: string,
  to: AdmissionStatus,
  columns: TransitionColumns
): Promise<AdmissionTransitionResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: admissionTable.id,
        bedId: admissionTable.bedId,
        status: admissionTable.status,
      })
      .from(admissionTable)
      .where(
        and(
          eq(admissionTable.id, id),
          eq(admissionTable.tenantId, tenantId),
          eq(admissionTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existing) {
      return { outcome: 'not-found' };
    }

    if (existing.status !== 'ADMITTED') {
      const current = await getAdmissionById(id, tenantId, tx);

      if (!current) {
        return { outcome: 'not-found' };
      }

      return { outcome: 'invalid-status', data: current };
    }

    const now = new Date();

    await tx
      .update(admissionTable)
      .set({ status: to, modifiedOn: now, ...columns(now) })
      .where(and(eq(admissionTable.id, id), eq(admissionTable.tenantId, tenantId)));

    await releaseBed(tx, tenantId, existing.bedId);

    const updated = await getAdmissionById(id, tenantId, tx);

    if (!updated) {
      throw new Error('Updated Admission could not be read');
    }

    return { outcome: 'updated', data: updated };
  });
}

async function dischargeAdmission(
  id: number,
  tenantId: string,
  dischargeDisposition: DischargeDisposition,
  dischargeSummary: string | undefined
): Promise<AdmissionTransitionResult> {
  return endAdmission(id, tenantId, 'DISCHARGED', (now) => ({
    dischargedAt: now,
    dischargeDisposition,
    dischargeSummary: dischargeSummary ?? null,
  }));
}

async function cancelAdmission(
  id: number,
  tenantId: string,
  cancellationReason: string
): Promise<AdmissionTransitionResult> {
  return endAdmission(id, tenantId, 'CANCELLED', (now) => ({
    cancelledAt: now,
    cancellationReason,
  }));
}

async function updateAdmission(
  id: number,
  tenantId: string,
  data: { admissionReason?: string; remarks?: string; expectedDischargeDate?: string }
): Promise<Admission | undefined> {
  const [updated] = await db
    .update(admissionTable)
    .set({
      admissionReason: data.admissionReason ?? null,
      remarks: data.remarks ?? null,
      expectedDischargeDate: data.expectedDischargeDate ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(admissionTable.id, id),
        eq(admissionTable.tenantId, tenantId),
        eq(admissionTable.isDeleted, false)
      )
    )
    .returning({ id: admissionTable.id });

  if (!updated) {
    return undefined;
  }

  return getAdmissionById(id, tenantId);
}

export type DeleteAdmissionResult =
  { outcome: 'deleted'; data: Admission } | { outcome: 'not-found' };

// Deleting an Active Admission must free its Bed exactly as discharging does —
// otherwise the Bed is stranded OCCUPIED with no visible Admission (ADR 0033).
async function deleteAdmission(id: number, tenantId: string): Promise<DeleteAdmissionResult> {
  return db.transaction(async (tx) => {
    const [existingRow] = await tx
      .select({
        id: admissionTable.id,
        bedId: admissionTable.bedId,
        status: admissionTable.status,
      })
      .from(admissionTable)
      .where(
        and(
          eq(admissionTable.id, id),
          eq(admissionTable.tenantId, tenantId),
          eq(admissionTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!existingRow) {
      return { outcome: 'not-found' };
    }

    const existing = await getAdmissionById(id, tenantId, tx);

    if (!existing) {
      return { outcome: 'not-found' };
    }

    const deletedOn = new Date();

    await tx
      .update(admissionTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(and(eq(admissionTable.id, id), eq(admissionTable.tenantId, tenantId)));

    if (existingRow.status === 'ADMITTED') {
      await releaseBed(tx, tenantId, existingRow.bedId);
    }

    return { outcome: 'deleted', data: existing };
  });
}

export const admissionRepository = {
  admitPatient,
  transferBed,
  getAdmissions,
  cancelAdmission,
  getAdmissionById,
  updateAdmission,
  deleteAdmission,
  dischargeAdmission,
  findActiveAdmissionByPatientId,
  getAdmissionForClinicalCapture,
  getBedTransfersByAdmissionId,
};
