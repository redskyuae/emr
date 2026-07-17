import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { clinicalNote as clinicalNoteTable } from '@/app/db/schema/clinical-note';
import type {
  ClinicalNote,
  ClinicalNoteListParams,
  ClinicalNoteStatus,
  CreateClinicalNoteData,
  UpdateClinicalNoteData,
} from '../schemas/clinical-note-schema';

const clinicalNoteColumns = {
  id: clinicalNoteTable.id,
  tenantId: clinicalNoteTable.tenantId,
  patientId: clinicalNoteTable.patientId,
  visitId: clinicalNoteTable.visitId,
  admissionId: clinicalNoteTable.admissionId,
  noteTypeId: clinicalNoteTable.noteTypeId,
  subjective: clinicalNoteTable.subjective,
  objective: clinicalNoteTable.objective,
  assessment: clinicalNoteTable.assessment,
  plan: clinicalNoteTable.plan,
  status: sql<ClinicalNoteStatus>`${clinicalNoteTable.status}`.as('status'),
  signedAt: clinicalNoteTable.signedAt,
  authorUserId: clinicalNoteTable.authorUserId,
  recordedByUserId: clinicalNoteTable.recordedByUserId,
  createdOn: clinicalNoteTable.createdOn,
  modifiedOn: clinicalNoteTable.modifiedOn,
};

async function createClinicalNote(data: CreateClinicalNoteData) {
  const [created] = await db
    .insert(clinicalNoteTable)
    .values({
      tenantId: data.tenantId,
      patientId: data.patientId,
      visitId: data.visitId ?? null,
      admissionId: data.admissionId ?? null,
      noteTypeId: data.noteTypeId,
      subjective: data.subjective ?? null,
      objective: data.objective ?? null,
      assessment: data.assessment ?? null,
      plan: data.plan ?? null,
      status: 'draft',
      authorUserId: data.authorUserId,
      recordedByUserId: data.recordedByUserId,
    })
    .returning(clinicalNoteColumns);

  return created;
}

async function updateClinicalNote(
  id: number,
  data: UpdateClinicalNoteData
): Promise<ClinicalNote | undefined> {
  const [updated] = await db
    .update(clinicalNoteTable)
    .set({
      noteTypeId: data.noteTypeId,
      visitId: data.visitId ?? null,
      admissionId: data.admissionId ?? null,
      subjective: data.subjective ?? null,
      objective: data.objective ?? null,
      assessment: data.assessment ?? null,
      plan: data.plan ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(clinicalNoteTable.id, id),
        eq(clinicalNoteTable.tenantId, data.tenantId),
        eq(clinicalNoteTable.isDeleted, false)
      )
    )
    .returning(clinicalNoteColumns);

  return updated;
}

async function signClinicalNote(id: number, tenantId: string): Promise<ClinicalNote | undefined> {
  const signedAt = new Date();

  const [signed] = await db
    .update(clinicalNoteTable)
    .set({ status: 'signed', signedAt, modifiedOn: signedAt })
    .where(
      and(
        eq(clinicalNoteTable.id, id),
        eq(clinicalNoteTable.tenantId, tenantId),
        eq(clinicalNoteTable.isDeleted, false)
      )
    )
    .returning(clinicalNoteColumns);

  return signed;
}

async function deleteClinicalNote(id: number, tenantId: string): Promise<ClinicalNote | undefined> {
  const deletedOn = new Date();

  const [deleted] = await db
    .update(clinicalNoteTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(clinicalNoteTable.id, id),
        eq(clinicalNoteTable.tenantId, tenantId),
        eq(clinicalNoteTable.isDeleted, false)
      )
    )
    .returning(clinicalNoteColumns);

  return deleted;
}

async function getClinicalNoteById(
  id: number,
  tenantId: string
): Promise<ClinicalNote | undefined> {
  const [note] = await db
    .select(clinicalNoteColumns)
    .from(clinicalNoteTable)
    .where(
      and(
        eq(clinicalNoteTable.id, id),
        eq(clinicalNoteTable.tenantId, tenantId),
        eq(clinicalNoteTable.isDeleted, false)
      )
    )
    .limit(1);

  return note;
}

async function getClinicalNotes({
  tenantId,
  patientId,
  page = 1,
  limit = 100,
}: ClinicalNoteListParams) {
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(clinicalNoteTable.tenantId, tenantId),
    eq(clinicalNoteTable.patientId, patientId),
    eq(clinicalNoteTable.isDeleted, false)
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(clinicalNoteColumns)
      .from(clinicalNoteTable)
      .where(whereClause)
      .orderBy(desc(clinicalNoteTable.createdOn), desc(clinicalNoteTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(clinicalNoteTable).where(whereClause),
  ]);

  return { data, total };
}

export const clinicalNoteRepository = {
  getClinicalNotes,
  createClinicalNote,
  updateClinicalNote,
  signClinicalNote,
  deleteClinicalNote,
  getClinicalNoteById,
};
