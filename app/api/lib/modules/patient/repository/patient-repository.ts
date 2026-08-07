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
  PatientIdentityDocument,
  PatientIdentityDocumentInput,
} from '../schemas/patient-schema';
import { normaliseEmiratesId } from '../schemas/patient-schema';
import { patientIdentityDocumentRepository } from './patient-identity-document-repository';
import { formatPatientMrn } from './patient-mrn';

type PatientRow = Omit<
  Patient,
  | 'gender'
  | 'bloodGroup'
  | 'maritalStatus'
  | 'preferredPaymentMethod'
  | 'identityDocuments'
  | 'patientIdentificationCategory'
> & {
  gender: string | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  preferredPaymentMethod: string | null;
  patientIdentificationCategory: string | null;
};

function toPatient(row: PatientRow, identityDocuments: PatientIdentityDocument[] = []): Patient {
  return {
    ...row,
    identityDocuments,
    gender: row.gender as Patient['gender'],
    bloodGroup: row.bloodGroup as Patient['bloodGroup'],
    maritalStatus: row.maritalStatus as Patient['maritalStatus'],
    preferredPaymentMethod: row.preferredPaymentMethod as Patient['preferredPaymentMethod'],
    patientIdentificationCategory:
      row.patientIdentificationCategory as Patient['patientIdentificationCategory'],
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
  emiratesId: patientTable.emiratesId,
  photoUrl: patientTable.photoUrl,
  isVip: patientTable.isVip,
  uid: patientTable.uid,
  bloodGroup: patientTable.bloodGroup,
  smsConsent: patientTable.smsConsent,
  middleName: patientTable.middleName,
  languageId: patientTable.languageId,
  religionId: patientTable.religionId,
  dateOfBirth: patientTable.dateOfBirth,
  addressLine1: patientTable.addressLine1,
  addressLine2: patientTable.addressLine2,
  maritalStatus: patientTable.maritalStatus,
  nationalityId: patientTable.nationalityId,
  isMedicalTourist: patientTable.isMedicalTourist,
  preferredPaymentMethod: patientTable.preferredPaymentMethod,
  alternatePhone: patientTable.alternatePhone,
  patientIdentificationCategory: patientTable.patientIdentificationCategory,
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
    emiratesId: data.emiratesId ?? null,
    photoUrl: data.emiratesId ? (data.photoUrl ?? null) : null,
    isVip: data.isVip ?? false,
    uid: data.uid ?? null,
    bloodGroup: data.bloodGroup ?? null,
    smsConsent: data.smsConsent ?? false,
    middleName: data.middleName ?? null,
    languageId: data.languageId ?? null,
    religionId: data.religionId ?? null,
    dateOfBirth: data.dateOfBirth,
    addressLine1: data.addressLine1 ?? null,
    addressLine2: data.addressLine2 ?? null,
    maritalStatus: data.maritalStatus ?? null,
    nationalityId: data.nationalityId ?? null,
    isMedicalTourist: data.isMedicalTourist ?? false,
    preferredPaymentMethod: data.preferredPaymentMethod ?? null,
    alternatePhone: data.alternatePhone ?? null,
    patientIdentificationCategory: data.emiratesId
      ? null
      : (data.patientIdentificationCategory ?? null),
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

  if (!patient) {
    return undefined;
  }

  const documentsByPatient = await patientIdentityDocumentRepository.listByPatientIds(tenantId, [
    patient.id,
  ]);

  return toPatient(patient, documentsByPatient.get(patient.id) ?? []);
}

// Applies the nested full replace by diffing on document id rather than
// rewriting the collection: rows whose id matched are updated, rows arriving
// without an id are inserted, and rows absent from the payload are soft-deleted.
// A delete-all-and-reinsert would tombstone an unchanged passport every time an
// unrelated field is edited, and reset its createdOn forever (ADR 0043).
async function replaceIdentityDocuments(
  tenantId: string,
  patientId: number,
  documents: PatientIdentityDocumentInput[],
  executor: Parameters<typeof patientIdentityDocumentRepository.insertMany>[3]
) {
  const existingIds = await patientIdentityDocumentRepository.listIdsForPatient(
    tenantId,
    patientId,
    executor
  );

  const submittedIds = new Set(
    documents.map((document) => document.id).filter((id): id is number => id !== undefined)
  );

  const newDocuments = documents.filter((document) => document.id === undefined);
  const removedIds = existingIds.filter((id) => !submittedIds.has(id));

  for (const document of documents) {
    if (document.id !== undefined) {
      await patientIdentityDocumentRepository.updateOne(
        tenantId,
        patientId,
        document.id,
        document,
        executor
      );
    }
  }

  await patientIdentityDocumentRepository.insertMany(tenantId, patientId, newDocuments, executor);
  await patientIdentityDocumentRepository.deleteIdentityDocuments(
    tenantId,
    patientId,
    removedIds,
    executor
  );
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

    // Same transaction as the patient row: a failed document write must not
    // leave a half-saved patient behind.
    await patientIdentityDocumentRepository.insertMany(
      data.tenantId,
      createdPatient.id,
      data.identityDocuments ?? [],
      tx
    );

    return createdPatient.id;
  });

  const created = await getPatientById(createdId, data.tenantId);

  if (!created) {
    throw new Error('Created Patient could not be read');
  }

  return created;
}

async function updatePatient(id: number, data: UpdatePatientData): Promise<Patient | undefined> {
  const updatedId = await db.transaction(async (tx) => {
    const [updatedPatient] = await tx
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

    await replaceIdentityDocuments(
      data.tenantId,
      updatedPatient.id,
      data.identityDocuments ?? [],
      tx
    );

    return updatedPatient.id;
  });

  if (updatedId === undefined) {
    return undefined;
  }

  return getPatientById(updatedId, data.tenantId);
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
  // Emirates IDs are stored digit-normalised but the card is printed with
  // dashes, so the query has to be normalised too. Guarded on the result being
  // non-empty: an unguarded strip turns a name search for O'Brien into '',
  // which would match every patient in the tenant (ADR 0042).
  const normalisedQuery = trimmedQuery ? normaliseEmiratesId(trimmedQuery) : '';
  const searchCondition = trimmedQuery
    ? or(
        ilike(patientTable.firstName, `%${trimmedQuery}%`),
        ilike(patientTable.middleName, `%${trimmedQuery}%`),
        ilike(patientTable.lastName, `%${trimmedQuery}%`),
        ilike(patientTable.mrn, `%${trimmedQuery}%`),
        ilike(patientTable.phone, `%${trimmedQuery}%`),
        normalisedQuery === '' ? undefined : ilike(patientTable.emiratesId, `%${normalisedQuery}%`)
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

  // One batched read for the whole page, never one query per row.
  const documentsByPatient = await patientIdentityDocumentRepository.listByPatientIds(
    tenantId,
    data.map((patient) => patient.id)
  );

  return {
    data: data.map((patient) => toPatient(patient, documentsByPatient.get(patient.id) ?? [])),
    total,
  };
}

// No lower() needed — the stored value is digits only.
async function findActiveByEmiratesId(
  tenantId: string,
  emiratesId: string,
  { excludeId }: { excludeId?: number } = {}
): Promise<{ id: number; emiratesId: string | null } | undefined> {
  const [patient] = await db
    .select({ id: patientTable.id, emiratesId: patientTable.emiratesId })
    .from(patientTable)
    .where(
      and(
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false),
        eq(patientTable.emiratesId, emiratesId),
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
  findActiveByEmiratesId,
};
