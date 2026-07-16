import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { patientAllergy as patientAllergyTable } from '@/app/db/schema/patient-allergy';
import type {
  AllergySeverity,
  AllergyStatus,
  CreatePatientAllergyData,
  PatientAllergy,
  PatientAllergyListParams,
  UpdatePatientAllergyData,
} from '../schemas/patient-allergy-schema';

const patientAllergyColumns = {
  id: patientAllergyTable.id,
  tenantId: patientAllergyTable.tenantId,
  patientId: patientAllergyTable.patientId,
  allergenId: patientAllergyTable.allergenId,
  substance: patientAllergyTable.substance,
  reaction: patientAllergyTable.reaction,
  severity: sql<AllergySeverity>`${patientAllergyTable.severity}`.as('severity'),
  status: sql<AllergyStatus>`${patientAllergyTable.status}`.as('allergy_status'),
  notedOn: patientAllergyTable.notedOn,
  notes: patientAllergyTable.notes,
  recordedByUserId: patientAllergyTable.recordedByUserId,
  createdOn: patientAllergyTable.createdOn,
  modifiedOn: patientAllergyTable.modifiedOn,
};

async function createPatientAllergy(data: CreatePatientAllergyData) {
  const [created] = await db
    .insert(patientAllergyTable)
    .values({
      tenantId: data.tenantId,
      patientId: data.patientId,
      allergenId: data.allergenId ?? null,
      substance: data.substance ?? null,
      reaction: data.reaction ?? null,
      severity: data.severity,
      status: data.status,
      notedOn: data.notedOn ?? null,
      notes: data.notes ?? null,
      recordedByUserId: data.recordedByUserId,
    })
    .returning(patientAllergyColumns);

  return created;
}

async function updatePatientAllergy(
  id: number,
  data: UpdatePatientAllergyData
): Promise<PatientAllergy | undefined> {
  const [updated] = await db
    .update(patientAllergyTable)
    .set({
      allergenId: data.allergenId ?? null,
      substance: data.substance ?? null,
      reaction: data.reaction ?? null,
      severity: data.severity,
      status: data.status,
      notedOn: data.notedOn ?? null,
      notes: data.notes ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(patientAllergyTable.id, id),
        eq(patientAllergyTable.tenantId, data.tenantId),
        eq(patientAllergyTable.isDeleted, false)
      )
    )
    .returning(patientAllergyColumns);

  return updated;
}

async function deletePatientAllergy(
  id: number,
  tenantId: string
): Promise<PatientAllergy | undefined> {
  const deletedOn = new Date();

  const [deleted] = await db
    .update(patientAllergyTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(patientAllergyTable.id, id),
        eq(patientAllergyTable.tenantId, tenantId),
        eq(patientAllergyTable.isDeleted, false)
      )
    )
    .returning(patientAllergyColumns);

  return deleted;
}

async function getPatientAllergyById(
  id: number,
  tenantId: string
): Promise<PatientAllergy | undefined> {
  const [allergy] = await db
    .select(patientAllergyColumns)
    .from(patientAllergyTable)
    .where(
      and(
        eq(patientAllergyTable.id, id),
        eq(patientAllergyTable.tenantId, tenantId),
        eq(patientAllergyTable.isDeleted, false)
      )
    )
    .limit(1);

  return allergy;
}

async function getPatientAllergies({
  tenantId,
  patientId,
  page = 1,
  limit = 100,
}: PatientAllergyListParams) {
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(patientAllergyTable.tenantId, tenantId),
    eq(patientAllergyTable.patientId, patientId),
    eq(patientAllergyTable.isDeleted, false)
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(patientAllergyColumns)
      .from(patientAllergyTable)
      .where(whereClause)
      .orderBy(desc(patientAllergyTable.createdOn), desc(patientAllergyTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(patientAllergyTable).where(whereClause),
  ]);

  return { data, total };
}

export const patientAllergyRepository = {
  getPatientAllergies,
  createPatientAllergy,
  updatePatientAllergy,
  deletePatientAllergy,
  getPatientAllergyById,
};
