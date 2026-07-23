import { and, asc, count, eq, ilike, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { country as countryTable } from '@/app/db/schema/country';
import { language as languageTable } from '@/app/db/schema/language';
import { nationality as nationalityTable } from '@/app/db/schema/nationality';
import {
  patient as patientTable,
  patientMrnCounter as patientMrnCounterTable,
} from '@/app/db/schema/patient';
import { religion as religionTable } from '@/app/db/schema/religion';
import { state as stateTable } from '@/app/db/schema/state';
import type {
  Patient,
  CreatePatientData,
  PatientListParams,
  UpdatePatientData,
} from '../schemas/patient-schema';
import { formatPatientMrn } from './patient-mrn';

type PatientRow = Omit<
  Patient,
  'gender' | 'bloodGroup' | 'maritalStatus' | 'preferredPaymentMethod' | 'govtIdType'
> & {
  gender: string | null;
  bloodGroup: string | null;
  govtIdType: string | null;
  maritalStatus: string | null;
  preferredPaymentMethod: string | null;
};

function toPatient(row: PatientRow): Patient {
  return {
    ...row,
    gender: row.gender as Patient['gender'],
    bloodGroup: row.bloodGroup as Patient['bloodGroup'],
    govtIdType: row.govtIdType as Patient['govtIdType'],
    maritalStatus: row.maritalStatus as Patient['maritalStatus'],
    preferredPaymentMethod: row.preferredPaymentMethod as Patient['preferredPaymentMethod'],
  };
}

const patientColumns = {
  id: patientTable.id,
  mrn: patientTable.mrn,
  city: patientTable.city,
  email: patientTable.email,
  phone: patientTable.phone,
  gender: patientTable.gender,
  stateId: patientTable.stateId,
  tenantId: patientTable.tenantId,
  isActive: patientTable.isActive,
  registrationStatus: patientTable.registrationStatus,
  lastName: patientTable.lastName,
  createdOn: patientTable.createdOn,
  countryId: patientTable.countryId,
  firstName: patientTable.firstName,
  modifiedOn: patientTable.modifiedOn,
  postalCode: patientTable.postalCode,
  govtIdType: patientTable.govtIdType,
  bloodGroup: patientTable.bloodGroup,
  middleName: patientTable.middleName,
  languageId: patientTable.languageId,
  religionId: patientTable.religionId,
  dateOfBirth: patientTable.dateOfBirth,
  addressLine1: patientTable.addressLine1,
  addressLine2: patientTable.addressLine2,
  govtIdNumber: patientTable.govtIdNumber,
  maritalStatus: patientTable.maritalStatus,
  nationalityId: patientTable.nationalityId,
  preferredPaymentMethod: patientTable.preferredPaymentMethod,
  alternatePhone: patientTable.alternatePhone,
  emergencyContactName: patientTable.emergencyContactName,
  emergencyContactPhone: patientTable.emergencyContactPhone,
  emergencyContactRelationship: patientTable.emergencyContactRelationship,
  state: { id: stateTable.id, name: stateTable.name },
  country: { id: countryTable.id, name: countryTable.name, code: countryTable.code },
  language: { id: languageTable.id, name: languageTable.name },
  religion: { id: religionTable.id, name: religionTable.name },
  nationality: { id: nationalityTable.id, name: nationalityTable.name },
};

function patientJoins() {
  return db
    .select(patientColumns)
    .from(patientTable)
    .leftJoin(
      stateTable,
      and(eq(stateTable.id, patientTable.stateId), eq(stateTable.isDeleted, false))
    )
    .leftJoin(
      countryTable,
      and(eq(countryTable.id, patientTable.countryId), eq(countryTable.isDeleted, false))
    )
    .leftJoin(
      nationalityTable,
      and(
        eq(nationalityTable.id, patientTable.nationalityId),
        eq(nationalityTable.isDeleted, false)
      )
    )
    .leftJoin(
      languageTable,
      and(eq(languageTable.id, patientTable.languageId), eq(languageTable.isDeleted, false))
    )
    .leftJoin(
      religionTable,
      and(eq(religionTable.id, patientTable.religionId), eq(religionTable.isDeleted, false))
    );
}

function patientValues(data: CreatePatientData | UpdatePatientData) {
  return {
    city: data.city ?? null,
    email: data.email ?? null,
    phone: data.phone,
    gender: data.gender,
    registrationStatus: 'registered' as const,
    tenantId: data.tenantId,
    stateId: data.stateId ?? null,
    lastName: data.lastName,
    countryId: data.countryId ?? null,
    firstName: data.firstName,
    postalCode: data.postalCode ?? null,
    govtIdType: data.govtIdType ?? null,
    bloodGroup: data.bloodGroup ?? null,
    middleName: data.middleName ?? null,
    languageId: data.languageId ?? null,
    religionId: data.religionId ?? null,
    dateOfBirth: data.dateOfBirth,
    addressLine1: data.addressLine1 ?? null,
    addressLine2: data.addressLine2 ?? null,
    govtIdNumber: data.govtIdNumber ?? null,
    maritalStatus: data.maritalStatus ?? null,
    nationalityId: data.nationalityId ?? null,
    preferredPaymentMethod: data.preferredPaymentMethod ?? null,
    alternatePhone: data.alternatePhone ?? null,
    emergencyContactName: data.emergencyContactName ?? null,
    emergencyContactPhone: data.emergencyContactPhone ?? null,
    emergencyContactRelationship: data.emergencyContactRelationship ?? null,
  };
}

async function getPatientById(id: number, tenantId: string): Promise<Patient | undefined> {
  const [patient] = await patientJoins()
    .where(
      and(
        eq(patientTable.id, id),
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .limit(1);

  return patient ? toPatient(patient) : undefined;
}

async function createPatient(data: CreatePatientData): Promise<Patient> {
  const createdId = await db.transaction(async (tx) => {
    const [counter] = await tx
      .insert(patientMrnCounterTable)
      .values({ tenantId: data.tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: patientMrnCounterTable.tenantId,
        set: { lastNumber: sql`${patientMrnCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: patientMrnCounterTable.lastNumber });

    const [createdPatient] = await tx
      .insert(patientTable)
      .values({ ...patientValues(data), mrn: formatPatientMrn(counter.lastNumber) })
      .returning({ id: patientTable.id });

    return createdPatient.id;
  });

  const created = await getPatientById(createdId, data.tenantId);

  if (!created) {
    throw new Error('Created Patient could not be read');
  }

  return created;
}

async function updatePatient(id: number, data: UpdatePatientData): Promise<Patient | undefined> {
  const [updatedPatient] = await db
    .update(patientTable)
    .set({ ...patientValues(data), modifiedOn: new Date() })
    .where(
      and(
        eq(patientTable.id, id),
        eq(patientTable.tenantId, data.tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .returning({ id: patientTable.id });

  if (!updatedPatient) {
    return undefined;
  }

  return getPatientById(updatedPatient.id, data.tenantId);
}

async function deletePatient(id: number, tenantId: string): Promise<Patient | undefined> {
  const existingPatient = await getPatientById(id, tenantId);

  if (!existingPatient) {
    return undefined;
  }

  const deletedOn = new Date();

  const [deletedPatient] = await db
    .update(patientTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(patientTable.id, id),
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .returning({ id: patientTable.id });

  if (!deletedPatient) {
    return undefined;
  }

  return existingPatient;
}

async function setPatientActive(
  id: number,
  tenantId: string,
  isActive: boolean
): Promise<Patient | undefined> {
  const now = new Date();

  const [updatedPatient] = await db
    .update(patientTable)
    .set({
      isActive,
      modifiedOn: now,
      // Stamp the transition instant so the Patient Timeline can place it;
      // modifiedOn alone is clobbered by any later edit (ADR 0041). The CASE keeps
      // the stamp honest: these endpoints are idempotent, so deactivating an
      // already-inactive Patient must not manufacture a second transition and drag
      // the existing Timeline Event forward. In an UPDATE ... SET the right-hand
      // reference reads the pre-update value, which is the flag we are flipping.
      ...(isActive
        ? {
            reactivatedAt: sql`case when ${patientTable.isActive} = false then ${now.toISOString()}::timestamptz else ${patientTable.reactivatedAt} end`,
          }
        : {
            deactivatedAt: sql`case when ${patientTable.isActive} = true then ${now.toISOString()}::timestamptz else ${patientTable.deactivatedAt} end`,
          }),
    })
    .where(
      and(
        eq(patientTable.id, id),
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .returning({ id: patientTable.id });

  if (!updatedPatient) {
    return undefined;
  }

  return getPatientById(updatedPatient.id, tenantId);
}

async function getPatients({
  tenantId,
  page = 1,
  limit = 10,
  query,
  gender,
  isActive,
}: PatientListParams): Promise<{ data: Patient[]; total: number }> {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(patientTable.firstName, `%${trimmedQuery}%`),
        ilike(patientTable.middleName, `%${trimmedQuery}%`),
        ilike(patientTable.lastName, `%${trimmedQuery}%`),
        ilike(patientTable.mrn, `%${trimmedQuery}%`),
        ilike(patientTable.phone, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(patientTable.tenantId, tenantId),
    eq(patientTable.isDeleted, false),
    gender ? eq(patientTable.gender, gender) : undefined,
    isActive === undefined ? undefined : eq(patientTable.isActive, isActive),
    searchCondition
  );

  const [data, [{ total }]] = await Promise.all([
    patientJoins()
      .where(whereClause)
      .orderBy(asc(patientTable.lastName), asc(patientTable.firstName), asc(patientTable.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(patientTable).where(whereClause),
  ]);

  return { data: data.map(toPatient), total };
}

async function findActiveByGovtId(
  tenantId: string,
  govtIdType: string,
  govtIdNumber: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<{ id: number; govtIdType: string | null; govtIdNumber: string | null } | undefined> {
  const [patient] = await db
    .select({
      id: patientTable.id,
      govtIdType: patientTable.govtIdType,
      govtIdNumber: patientTable.govtIdNumber,
    })
    .from(patientTable)
    .where(
      and(
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false),
        eq(patientTable.govtIdType, govtIdType),
        sql`lower(${patientTable.govtIdNumber}) = ${govtIdNumber.toLowerCase()}`,
        excludeId ? ne(patientTable.id, excludeId) : undefined
      )
    )
    .limit(1);

  return patient;
}

export const patientRepository = {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientById,
  setPatientActive,
  findActiveByGovtId,
};
