import { and, count, desc, eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { patientVitalSign as patientVitalSignTable } from '@/app/db/schema/patient-vital-sign';
import type {
  CreatePatientVitalSignData,
  PatientVitalSign,
  PatientVitalSignListParams,
  UpdatePatientVitalSignData,
} from '../schemas/patient-vital-sign-schema';

const patientVitalSignColumns = {
  id: patientVitalSignTable.id,
  tenantId: patientVitalSignTable.tenantId,
  patientId: patientVitalSignTable.patientId,
  visitId: patientVitalSignTable.visitId,
  admissionId: patientVitalSignTable.admissionId,
  recordedAt: patientVitalSignTable.recordedAt,
  heightCm: patientVitalSignTable.heightCm,
  weightKg: patientVitalSignTable.weightKg,
  bmi: patientVitalSignTable.bmi,
  systolic: patientVitalSignTable.systolic,
  diastolic: patientVitalSignTable.diastolic,
  pulseBpm: patientVitalSignTable.pulseBpm,
  respRate: patientVitalSignTable.respRate,
  temperatureC: patientVitalSignTable.temperatureC,
  spo2: patientVitalSignTable.spo2,
  painScore: patientVitalSignTable.painScore,
  notes: patientVitalSignTable.notes,
  recordedByUserId: patientVitalSignTable.recordedByUserId,
  createdOn: patientVitalSignTable.createdOn,
  modifiedOn: patientVitalSignTable.modifiedOn,
};

async function createPatientVitalSign(data: CreatePatientVitalSignData) {
  const [created] = await db
    .insert(patientVitalSignTable)
    .values({
      tenantId: data.tenantId,
      patientId: data.patientId,
      visitId: data.visitId ?? null,
      admissionId: data.admissionId ?? null,
      recordedAt: data.recordedAt ?? new Date(),
      heightCm: data.heightCm ?? null,
      weightKg: data.weightKg ?? null,
      bmi: data.bmi ?? null,
      systolic: data.systolic ?? null,
      diastolic: data.diastolic ?? null,
      pulseBpm: data.pulseBpm ?? null,
      respRate: data.respRate ?? null,
      temperatureC: data.temperatureC ?? null,
      spo2: data.spo2 ?? null,
      painScore: data.painScore ?? null,
      notes: data.notes ?? null,
      recordedByUserId: data.recordedByUserId,
    })
    .returning(patientVitalSignColumns);

  return created;
}

async function updatePatientVitalSign(
  id: number,
  data: UpdatePatientVitalSignData
): Promise<PatientVitalSign | undefined> {
  const [updated] = await db
    .update(patientVitalSignTable)
    .set({
      visitId: data.visitId ?? null,
      admissionId: data.admissionId ?? null,
      recordedAt: data.recordedAt ?? new Date(),
      heightCm: data.heightCm ?? null,
      weightKg: data.weightKg ?? null,
      bmi: data.bmi ?? null,
      systolic: data.systolic ?? null,
      diastolic: data.diastolic ?? null,
      pulseBpm: data.pulseBpm ?? null,
      respRate: data.respRate ?? null,
      temperatureC: data.temperatureC ?? null,
      spo2: data.spo2 ?? null,
      painScore: data.painScore ?? null,
      notes: data.notes ?? null,
      modifiedOn: new Date(),
    })
    .where(
      and(
        eq(patientVitalSignTable.id, id),
        eq(patientVitalSignTable.tenantId, data.tenantId),
        eq(patientVitalSignTable.isDeleted, false)
      )
    )
    .returning(patientVitalSignColumns);

  return updated;
}

async function deletePatientVitalSign(
  id: number,
  tenantId: string
): Promise<PatientVitalSign | undefined> {
  const deletedOn = new Date();

  const [deleted] = await db
    .update(patientVitalSignTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(patientVitalSignTable.id, id),
        eq(patientVitalSignTable.tenantId, tenantId),
        eq(patientVitalSignTable.isDeleted, false)
      )
    )
    .returning(patientVitalSignColumns);

  return deleted;
}

async function getPatientVitalSignById(
  id: number,
  tenantId: string
): Promise<PatientVitalSign | undefined> {
  const [vitalSign] = await db
    .select(patientVitalSignColumns)
    .from(patientVitalSignTable)
    .where(
      and(
        eq(patientVitalSignTable.id, id),
        eq(patientVitalSignTable.tenantId, tenantId),
        eq(patientVitalSignTable.isDeleted, false)
      )
    )
    .limit(1);

  return vitalSign;
}

async function getPatientVitalSigns({
  tenantId,
  patientId,
  page = 1,
  limit = 100,
}: PatientVitalSignListParams) {
  const offset = (page - 1) * limit;
  const whereClause = and(
    eq(patientVitalSignTable.tenantId, tenantId),
    eq(patientVitalSignTable.patientId, patientId),
    eq(patientVitalSignTable.isDeleted, false)
  );

  const [data, [{ total }]] = await Promise.all([
    db
      .select(patientVitalSignColumns)
      .from(patientVitalSignTable)
      .where(whereClause)
      .orderBy(desc(patientVitalSignTable.recordedAt), desc(patientVitalSignTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(patientVitalSignTable).where(whereClause),
  ]);

  return { data, total };
}

export const patientVitalSignRepository = {
  getPatientVitalSigns,
  createPatientVitalSign,
  updatePatientVitalSign,
  deletePatientVitalSign,
  getPatientVitalSignById,
};
