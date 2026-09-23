import { and, asc, count, eq, ilike, inArray, isNull, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { appointment as appointmentTable } from '@/app/db/schema/appointment';
import {
  treatment as treatmentTable,
  treatmentSession as treatmentSessionTable,
} from '@/app/db/schema/treatment';
import { visit as visitTable } from '@/app/db/schema/visit';
import type {
  CreateTreatmentData,
  Treatment,
  TreatmentListParams,
  TreatmentSession,
  UpdateTreatmentData,
} from '../schemas/treatment-schema';

const treatmentColumns = {
  id: treatmentTable.id,
  name: treatmentTable.name,
  code: treatmentTable.code,
  sessionStructure: treatmentTable.sessionStructure,
  defaultTotalSessions: treatmentTable.defaultTotalSessions,
  legacySourceIdentity: treatmentTable.legacySourceIdentity,
  legacySourceSystem: treatmentTable.legacySourceSystem,
  tenantId: treatmentTable.tenantId,
  createdOn: treatmentTable.createdOn,
  modifiedOn: treatmentTable.modifiedOn,
  description: treatmentTable.description,
  roomType: treatmentTable.roomType,
  setupMinutes: treatmentTable.setupMinutes,
  therapistSkill: treatmentTable.therapistSkill,
  durationMinutes: treatmentTable.durationMinutes,
  cleaningMinutes: treatmentTable.cleaningMinutes,
};

const sessionColumns = {
  id: treatmentSessionTable.id,
  label: treatmentSessionTable.label,
  warning: treatmentSessionTable.warning,
  tenantId: treatmentSessionTable.tenantId,
  roomType: treatmentSessionTable.roomType,
  createdOn: treatmentSessionTable.createdOn,
  equipment: treatmentSessionTable.equipment,
  procedure: treatmentSessionTable.procedure,
  modifiedOn: treatmentSessionTable.modifiedOn,
  treatmentId: treatmentSessionTable.treatmentId,
  preparation: treatmentSessionTable.preparation,
  setupMinutes: treatmentSessionTable.setupMinutes,
  sessionNumber: treatmentSessionTable.sessionNumber,
  therapistSkill: treatmentSessionTable.therapistSkill,
  durationMinutes: treatmentSessionTable.durationMinutes,
  cleaningMinutes: treatmentSessionTable.cleaningMinutes,
};

type TreatmentRow = Omit<Treatment, 'sessions'>;
type Executor = Pick<typeof db, 'select' | 'insert' | 'update'>;

async function getSessionsByTreatmentIds(
  treatmentIds: number[],
  tenantId: string,
  executor: Executor = db
) {
  if (treatmentIds.length === 0) {
    return new Map<number, TreatmentSession[]>();
  }

  const rows = await executor
    .select(sessionColumns)
    .from(treatmentSessionTable)
    .where(
      and(
        eq(treatmentSessionTable.tenantId, tenantId),
        eq(treatmentSessionTable.isDeleted, false),
        inArray(treatmentSessionTable.treatmentId, treatmentIds)
      )
    )
    .orderBy(asc(treatmentSessionTable.sessionNumber), asc(treatmentSessionTable.id));

  const sessionsByTreatment = new Map<number, TreatmentSession[]>();

  for (const row of rows) {
    const sessions = sessionsByTreatment.get(row.treatmentId) ?? [];
    sessions.push(row);
    sessionsByTreatment.set(row.treatmentId, sessions);
  }

  return sessionsByTreatment;
}

function withSessions(row: TreatmentRow, sessions: TreatmentSession[] = []): Treatment {
  return { ...row, sessions };
}

async function insertSessions(executor: Executor, data: CreateTreatmentData, treatmentId: number) {
  await executor.insert(treatmentSessionTable).values(
    data.sessions.map((session) => ({
      tenantId: data.tenantId,
      treatmentId,
      label: session.label,
      warning: session.warning ?? null,
      roomType: session.roomType ?? data.roomType ?? null,
      equipment: session.equipment ?? null,
      procedure: session.procedure,
      preparation: session.preparation ?? null,
      setupMinutes: session.setupMinutes,
      sessionNumber: session.sessionNumber,
      therapistSkill: session.therapistSkill ?? data.therapistSkill ?? null,
      durationMinutes: session.durationMinutes,
      cleaningMinutes: session.cleaningMinutes,
    }))
  );
}

async function createTreatment(data: CreateTreatmentData) {
  return db.transaction(async (tx) => {
    const [createdTreatment] = await tx
      .insert(treatmentTable)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        code: data.code,
        sessionStructure: data.sessionStructure ?? 'SEQUENCED',
        defaultTotalSessions: data.defaultTotalSessions ?? null,
        description: data.description ?? null,
        durationMinutes: data.durationMinutes,
        setupMinutes: data.setupMinutes,
        cleaningMinutes: data.cleaningMinutes,
        roomType: data.roomType ?? null,
        therapistSkill: data.therapistSkill ?? null,
      })
      .returning(treatmentColumns);

    await insertSessions(tx, data, createdTreatment.id);

    const created = await getTreatmentById(createdTreatment.id, data.tenantId, tx);

    if (!created) {
      throw new Error('Created Treatment could not be read');
    }

    return created;
  });
}

async function updateTreatment(
  id: number,
  data: UpdateTreatmentData
): Promise<Treatment | undefined> {
  const [updatedTreatment] = await db
    .update(treatmentTable)
    .set({
      name: data.name,
      code: data.code,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes,
      setupMinutes: data.setupMinutes,
      cleaningMinutes: data.cleaningMinutes,
      roomType: data.roomType ?? null,
      therapistSkill: data.therapistSkill ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(treatmentTable.id, id),
        eq(treatmentTable.tenantId, data.tenantId),
        eq(treatmentTable.isDeleted, false)
      )
    )
    .returning({ id: treatmentTable.id });

  if (!updatedTreatment) {
    return undefined;
  }

  return getTreatmentById(id, data.tenantId);
}

async function deleteTreatment(id: number, tenantId: string): Promise<Treatment | undefined> {
  const existing = await getTreatmentById(id, tenantId);

  if (!existing) {
    return undefined;
  }

  const deletedOn = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(treatmentSessionTable)
      .set({
        isDeleted: true,
        modifiedOn: deletedOn,
        deletedOn,
      })
      .where(
        and(
          eq(treatmentSessionTable.treatmentId, id),
          eq(treatmentSessionTable.tenantId, tenantId),
          eq(treatmentSessionTable.isDeleted, false)
        )
      );

    await tx
      .update(treatmentTable)
      .set({
        isDeleted: true,
        modifiedOn: deletedOn,
        deletedOn,
      })
      .where(
        and(
          eq(treatmentTable.id, id),
          eq(treatmentTable.tenantId, tenantId),
          eq(treatmentTable.isDeleted, false)
        )
      );
  });

  return existing;
}

async function isTreatmentInUse(id: number, tenantId: string) {
  const [appointment] = await db
    .select({ id: appointmentTable.id })
    .from(appointmentTable)
    .where(
      and(
        eq(appointmentTable.tenantId, tenantId),
        eq(appointmentTable.treatmentId, id),
        eq(appointmentTable.isDeleted, false)
      )
    )
    .limit(1);

  if (appointment) {
    return true;
  }

  const [visit] = await db
    .select({ id: visitTable.id })
    .from(visitTable)
    .where(
      and(
        eq(visitTable.tenantId, tenantId),
        eq(visitTable.treatmentId, id),
        eq(visitTable.isDeleted, false)
      )
    )
    .limit(1);

  return Boolean(visit);
}

async function getTreatmentById(
  id: number,
  tenantId: string,
  executor: Executor = db
): Promise<Treatment | undefined> {
  const [treatment] = await executor
    .select(treatmentColumns)
    .from(treatmentTable)
    .where(
      and(
        eq(treatmentTable.id, id),
        eq(treatmentTable.tenantId, tenantId),
        eq(treatmentTable.isDeleted, false)
      )
    )
    .limit(1);

  if (!treatment) {
    return undefined;
  }

  const sessionsByTreatment = await getSessionsByTreatmentIds([id], tenantId, executor);

  return withSessions(treatment, sessionsByTreatment.get(id) ?? []);
}

async function getTreatmentSessionById(
  id: number,
  tenantId: string
): Promise<TreatmentSession | undefined> {
  const [session] = await db
    .select(sessionColumns)
    .from(treatmentSessionTable)
    .where(
      and(
        eq(treatmentSessionTable.id, id),
        eq(treatmentSessionTable.tenantId, tenantId),
        eq(treatmentSessionTable.isDeleted, false)
      )
    )
    .limit(1);

  return session;
}

async function getTreatments({ tenantId, page = 1, limit = 10, query }: TreatmentListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(treatmentTable.name, `%${trimmedQuery}%`),
        ilike(treatmentTable.code, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(treatmentTable.tenantId, tenantId),
    eq(treatmentTable.isDeleted, false),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(treatmentColumns)
      .from(treatmentTable)
      .where(whereClause)
      .orderBy(asc(treatmentTable.name), asc(treatmentTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(treatmentTable).where(whereClause),
  ]);

  const sessionsByTreatment = await getSessionsByTreatmentIds(
    data.map((treatment) => treatment.id),
    tenantId
  );

  return {
    total,
    data: data.map((treatment) =>
      withSessions(treatment, sessionsByTreatment.get(treatment.id) ?? [])
    ),
  };
}

async function findActiveByName(
  tenantId: string,
  name: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<TreatmentRow | undefined> {
  const [treatment] = await db
    .select(treatmentColumns)
    .from(treatmentTable)
    .where(
      and(
        eq(treatmentTable.tenantId, tenantId),
        eq(treatmentTable.isDeleted, false),
        isNull(treatmentTable.legacySourceIdentity),
        sql`lower(${treatmentTable.name}) = ${name.toLowerCase()}`,
        excludeId ? ne(treatmentTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return treatment;
}

async function findActiveByCode(
  tenantId: string,
  code: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<TreatmentRow | undefined> {
  const [treatment] = await db
    .select(treatmentColumns)
    .from(treatmentTable)
    .where(
      and(
        eq(treatmentTable.tenantId, tenantId),
        eq(treatmentTable.isDeleted, false),
        isNull(treatmentTable.legacySourceIdentity),
        sql`lower(${treatmentTable.code}) = ${code.toLowerCase()}`,
        excludeId ? ne(treatmentTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return treatment;
}

type TreatmentSeed = Omit<CreateTreatmentData, 'tenantId'>;

async function seedDefaultTreatments(tenantId: string, defaults: TreatmentSeed[]) {
  if (defaults.length === 0) {
    return;
  }

  for (const treatment of defaults) {
    const existing = await findActiveByCode(tenantId, treatment.code);

    if (existing) {
      continue;
    }

    await createTreatment({ ...treatment, tenantId });
  }
}

export const treatmentRepository = {
  getTreatments,
  findActiveByCode,
  findActiveByName,
  isTreatmentInUse,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  getTreatmentById,
  seedDefaultTreatments,
  getTreatmentSessionById,
};
