import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { patientProblem as patientProblemTable } from '@/app/db/schema/patient-problem';
import type {
  CreatePatientProblemData,
  PatientProblem,
  PatientProblemListParams,
  ProblemClinicalStatus,
  UpdatePatientProblemData,
} from '../schemas/patient-problem-schema';

const patientProblemColumns = {
  id: patientProblemTable.id,
  tenantId: patientProblemTable.tenantId,
  patientId: patientProblemTable.patientId,
  diagnosisCodeId: patientProblemTable.diagnosisCodeId,
  title: patientProblemTable.title,
  clinicalStatus: sql<ProblemClinicalStatus>`${patientProblemTable.clinicalStatus}`.as(
    'clinical_status'
  ),
  onsetDate: patientProblemTable.onsetDate,
  resolvedDate: patientProblemTable.resolvedDate,
  notes: patientProblemTable.notes,
  recordedByUserId: patientProblemTable.recordedByUserId,
  createdOn: patientProblemTable.createdOn,
  modifiedOn: patientProblemTable.modifiedOn,
};

async function createPatientProblem(data: CreatePatientProblemData) {
  const [created] = await db
    .insert(patientProblemTable)
    .values({
      tenantId: data.tenantId,
      patientId: data.patientId,
      diagnosisCodeId: data.diagnosisCodeId ?? null,
      title: data.title,
      clinicalStatus: data.clinicalStatus,
      onsetDate: data.onsetDate ?? null,
      resolvedDate: data.resolvedDate ?? null,
      notes: data.notes ?? null,
      recordedByUserId: data.recordedByUserId,
    })
    .returning(patientProblemColumns);

  return created;
}

async function updatePatientProblem(
  id: number,
  data: UpdatePatientProblemData
): Promise<PatientProblem | undefined> {
  const [updated] = await db
    .update(patientProblemTable)
    .set({
      diagnosisCodeId: data.diagnosisCodeId ?? null,
      title: data.title,
      clinicalStatus: data.clinicalStatus,
      onsetDate: data.onsetDate ?? null,
      resolvedDate: data.resolvedDate ?? null,
      notes: data.notes ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(patientProblemTable.id, id),
        eq(patientProblemTable.tenantId, data.tenantId),
        eq(patientProblemTable.isDeleted, false)
      )
    )
    .returning(patientProblemColumns);

  return updated;
}

async function deletePatientProblem(
  id: number,
  tenantId: string
): Promise<PatientProblem | undefined> {
  const deletedOn = new Date();

  const [deleted] = await db
    .update(patientProblemTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(patientProblemTable.id, id),
        eq(patientProblemTable.tenantId, tenantId),
        eq(patientProblemTable.isDeleted, false)
      )
    )
    .returning(patientProblemColumns);

  return deleted;
}

async function getPatientProblemById(
  id: number,
  tenantId: string
): Promise<PatientProblem | undefined> {
  const [problem] = await db
    .select(patientProblemColumns)
    .from(patientProblemTable)
    .where(
      and(
        eq(patientProblemTable.id, id),
        eq(patientProblemTable.tenantId, tenantId),
        eq(patientProblemTable.isDeleted, false)
      )
    )
    .limit(1);

  return problem;
}

async function getPatientProblems({
  tenantId,
  patientId,
  page = 1,
  limit = 100,
}: PatientProblemListParams) {
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(patientProblemTable.tenantId, tenantId),
    eq(patientProblemTable.patientId, patientId),
    eq(patientProblemTable.isDeleted, false)
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(patientProblemColumns)
      .from(patientProblemTable)
      .where(whereClause)
      .orderBy(desc(patientProblemTable.createdOn), desc(patientProblemTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(patientProblemTable).where(whereClause),
  ]);

  return { data, total };
}

export const patientProblemRepository = {
  getPatientProblems,
  createPatientProblem,
  updatePatientProblem,
  deletePatientProblem,
  getPatientProblemById,
};
