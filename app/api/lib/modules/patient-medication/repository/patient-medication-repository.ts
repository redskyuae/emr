import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { patientMedication as patientMedicationTable } from '@/app/db/schema/patient-medication';
import type {
  CreatePatientMedicationData,
  MedicationStatus,
  PatientMedication,
  PatientMedicationListParams,
  UpdatePatientMedicationData,
} from '../schemas/patient-medication-schema';

const patientMedicationColumns = {
  id: patientMedicationTable.id,
  tenantId: patientMedicationTable.tenantId,
  patientId: patientMedicationTable.patientId,
  drugName: patientMedicationTable.drugName,
  dose: patientMedicationTable.dose,
  route: patientMedicationTable.route,
  frequency: patientMedicationTable.frequency,
  status: sql<MedicationStatus>`${patientMedicationTable.status}`.as('medication_status'),
  startDate: patientMedicationTable.startDate,
  endDate: patientMedicationTable.endDate,
  notes: patientMedicationTable.notes,
  recordedByUserId: patientMedicationTable.recordedByUserId,
  createdOn: patientMedicationTable.createdOn,
  modifiedOn: patientMedicationTable.modifiedOn,
};

async function createPatientMedication(data: CreatePatientMedicationData) {
  const [created] = await db
    .insert(patientMedicationTable)
    .values({
      tenantId: data.tenantId,
      patientId: data.patientId,
      drugName: data.drugName,
      dose: data.dose ?? null,
      route: data.route ?? null,
      frequency: data.frequency ?? null,
      status: data.status,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      notes: data.notes ?? null,
      recordedByUserId: data.recordedByUserId,
    })
    .returning(patientMedicationColumns);

  return created;
}

async function updatePatientMedication(
  id: number,
  data: UpdatePatientMedicationData
): Promise<PatientMedication | undefined> {
  const [updated] = await db
    .update(patientMedicationTable)
    .set({
      drugName: data.drugName,
      dose: data.dose ?? null,
      route: data.route ?? null,
      frequency: data.frequency ?? null,
      status: data.status,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      notes: data.notes ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(patientMedicationTable.id, id),
        eq(patientMedicationTable.tenantId, data.tenantId),
        eq(patientMedicationTable.isDeleted, false)
      )
    )
    .returning(patientMedicationColumns);

  return updated;
}

async function deletePatientMedication(
  id: number,
  tenantId: string
): Promise<PatientMedication | undefined> {
  const deletedOn = new Date();

  const [deleted] = await db
    .update(patientMedicationTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(patientMedicationTable.id, id),
        eq(patientMedicationTable.tenantId, tenantId),
        eq(patientMedicationTable.isDeleted, false)
      )
    )
    .returning(patientMedicationColumns);

  return deleted;
}

async function getPatientMedicationById(
  id: number,
  tenantId: string
): Promise<PatientMedication | undefined> {
  const [medication] = await db
    .select(patientMedicationColumns)
    .from(patientMedicationTable)
    .where(
      and(
        eq(patientMedicationTable.id, id),
        eq(patientMedicationTable.tenantId, tenantId),
        eq(patientMedicationTable.isDeleted, false)
      )
    )
    .limit(1);

  return medication;
}

async function getPatientMedications({
  tenantId,
  patientId,
  page = 1,
  limit = 100,
}: PatientMedicationListParams) {
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(patientMedicationTable.tenantId, tenantId),
    eq(patientMedicationTable.patientId, patientId),
    eq(patientMedicationTable.isDeleted, false)
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(patientMedicationColumns)
      .from(patientMedicationTable)
      .where(whereClause)
      .orderBy(desc(patientMedicationTable.createdOn), desc(patientMedicationTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(patientMedicationTable).where(whereClause),
  ]);

  return { data, total };
}

export const patientMedicationRepository = {
  getPatientMedications,
  createPatientMedication,
  updatePatientMedication,
  deletePatientMedication,
  getPatientMedicationById,
};
