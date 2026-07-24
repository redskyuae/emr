import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/app/db';
import { country as countryTable } from '@/app/db/schema/country';
import { patientIdentityDocument as patientIdentityDocumentTable } from '@/app/db/schema/patient-identity-document';
import type {
  PatientIdentityDocument,
  PatientIdentityDocumentInput,
} from '../schemas/patient-schema';

// Both the patient row write and the document diff run inside one transaction,
// so every function here accepts the surrounding executor.
type Executor = Pick<typeof db, 'select' | 'insert' | 'update'>;

type DocumentRow = Omit<PatientIdentityDocument, 'documentType'> & { documentType: string };

function toIdentityDocument(row: DocumentRow): PatientIdentityDocument {
  return {
    ...row,
    documentType: row.documentType as PatientIdentityDocument['documentType'],
  };
}

const documentColumns = {
  id: patientIdentityDocumentTable.id,
  label: patientIdentityDocumentTable.label,
  expiryDate: patientIdentityDocumentTable.expiryDate,
  documentType: patientIdentityDocumentTable.documentType,
  documentNumber: patientIdentityDocumentTable.documentNumber,
  issuingCountryId: patientIdentityDocumentTable.issuingCountryId,
  issuingCountry: { id: countryTable.id, name: countryTable.name, code: countryTable.code },
};

function documentValues(document: PatientIdentityDocumentInput) {
  return {
    documentType: document.documentType,
    documentNumber: document.documentNumber,
    // Only some branches of the discriminated union carry these, so read them
    // defensively rather than assuming the widened type has them.
    label: 'label' in document ? (document.label ?? null) : null,
    expiryDate: 'expiryDate' in document ? (document.expiryDate ?? null) : null,
    issuingCountryId: 'issuingCountryId' in document ? (document.issuingCountryId ?? null) : null,
  };
}

// Batch-loaded for a whole page of patients — never one query per row.
async function listByPatientIds(
  tenantId: string,
  patientIds: number[],
  executor: Executor = db
): Promise<Map<number, PatientIdentityDocument[]>> {
  const grouped = new Map<number, PatientIdentityDocument[]>();

  if (patientIds.length === 0) {
    return grouped;
  }

  const rows = await executor
    .select({ ...documentColumns, patientId: patientIdentityDocumentTable.patientId })
    .from(patientIdentityDocumentTable)
    .leftJoin(
      countryTable,
      and(
        eq(countryTable.id, patientIdentityDocumentTable.issuingCountryId),
        eq(countryTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(patientIdentityDocumentTable.tenantId, tenantId),
        eq(patientIdentityDocumentTable.isDeleted, false),
        inArray(patientIdentityDocumentTable.patientId, patientIds)
      )
    )
    .orderBy(patientIdentityDocumentTable.id);

  for (const { patientId, ...row } of rows) {
    const existing = grouped.get(patientId) ?? [];
    existing.push(toIdentityDocument(row));
    grouped.set(patientId, existing);
  }

  return grouped;
}

// Backs the ownership check in the validator. Scoped by tenant AND patient on
// purpose: a document id alone is a client-supplied value and must never be
// trusted to identify what it claims (ADR 0043).
async function findIdsForPatient(
  tenantId: string,
  patientId: number,
  ids: number[],
  executor: Executor = db
): Promise<number[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await executor
    .select({ id: patientIdentityDocumentTable.id })
    .from(patientIdentityDocumentTable)
    .where(
      and(
        eq(patientIdentityDocumentTable.tenantId, tenantId),
        eq(patientIdentityDocumentTable.patientId, patientId),
        eq(patientIdentityDocumentTable.isDeleted, false),
        inArray(patientIdentityDocumentTable.id, ids)
      )
    );

  return rows.map((row) => row.id);
}

async function listIdsForPatient(
  tenantId: string,
  patientId: number,
  executor: Executor = db
): Promise<number[]> {
  const rows = await executor
    .select({ id: patientIdentityDocumentTable.id })
    .from(patientIdentityDocumentTable)
    .where(
      and(
        eq(patientIdentityDocumentTable.tenantId, tenantId),
        eq(patientIdentityDocumentTable.patientId, patientId),
        eq(patientIdentityDocumentTable.isDeleted, false)
      )
    );

  return rows.map((row) => row.id);
}

async function insertMany(
  tenantId: string,
  patientId: number,
  documents: PatientIdentityDocumentInput[],
  executor: Executor = db
): Promise<void> {
  if (documents.length === 0) {
    return;
  }

  await executor.insert(patientIdentityDocumentTable).values(
    documents.map((document) => ({
      ...documentValues(document),
      tenantId,
      patientId,
    }))
  );
}

async function updateOne(
  tenantId: string,
  patientId: number,
  id: number,
  document: PatientIdentityDocumentInput,
  executor: Executor = db
): Promise<void> {
  await executor
    .update(patientIdentityDocumentTable)
    .set({ ...documentValues(document), modifiedOn: new Date() })
    .where(
      and(
        eq(patientIdentityDocumentTable.id, id),
        eq(patientIdentityDocumentTable.tenantId, tenantId),
        eq(patientIdentityDocumentTable.patientId, patientId),
        eq(patientIdentityDocumentTable.isDeleted, false)
      )
    );
}

// Soft delete, per ADR 0012 — the name carries no `soft` prefix by convention.
async function deleteIdentityDocuments(
  tenantId: string,
  patientId: number,
  ids: number[],
  executor: Executor = db
): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  const deletedOn = new Date();

  await executor
    .update(patientIdentityDocumentTable)
    .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
    .where(
      and(
        eq(patientIdentityDocumentTable.tenantId, tenantId),
        eq(patientIdentityDocumentTable.patientId, patientId),
        eq(patientIdentityDocumentTable.isDeleted, false),
        inArray(patientIdentityDocumentTable.id, ids)
      )
    );
}

export const patientIdentityDocumentRepository = {
  insertMany,
  updateOne,
  listByPatientIds,
  findIdsForPatient,
  listIdsForPatient,
  deleteIdentityDocuments,
};
