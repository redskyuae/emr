import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/app/db';
import { ayurvedaDiagnosisCode as ayurvedaDiagnosisCodeTable } from '@/app/db/schema/ayurveda-diagnosis-code';
import { diagnosisCode as diagnosisCodeTable } from '@/app/db/schema/diagnosis-code';
import { visit as visitTable } from '@/app/db/schema/visit';
import { visitDiagnosis as visitDiagnosisTable } from '@/app/db/schema/visit-diagnosis';
import type { VisitDiagnosis, VisitDiagnosisEntry } from '../schemas/visit-diagnosis-schema';

const icdMappingTable = alias(diagnosisCodeTable, 'icd_mapping');

type DiagnosisCodeReference = { id: number; code: string; isDeleted: boolean };

// Recorded codes are joined without an is_deleted filter so a Visit's history
// still reads after its Diagnosis Code or Ayurveda Diagnosis Code is deleted.
async function listByVisit(tenantId: string, visitId: number): Promise<VisitDiagnosis[]> {
  const rows = await db
    .select({
      id: visitDiagnosisTable.id,
      notes: visitDiagnosisTable.notes,
      visitId: visitDiagnosisTable.visitId,
      sortOrder: visitDiagnosisTable.sortOrder,
      codeSystem: visitDiagnosisTable.codeSystem,
      diagnosisType: visitDiagnosisTable.diagnosisType,
      diagnosisCodeId: visitDiagnosisTable.diagnosisCodeId,
      ayurvedaDiagnosisCodeId: visitDiagnosisTable.ayurvedaDiagnosisCodeId,
      icdCode: diagnosisCodeTable.code,
      icdTitle: diagnosisCodeTable.title,
      ayurvedaCode: ayurvedaDiagnosisCodeTable.code,
      ayurvedaName: ayurvedaDiagnosisCodeTable.name,
      ayurvedaEnglishName: ayurvedaDiagnosisCodeTable.englishName,
      icdMapping: {
        id: icdMappingTable.id,
        code: icdMappingTable.code,
        title: icdMappingTable.title,
      },
    })
    .from(visitDiagnosisTable)
    .leftJoin(
      diagnosisCodeTable,
      and(
        eq(diagnosisCodeTable.id, visitDiagnosisTable.diagnosisCodeId),
        eq(diagnosisCodeTable.tenantId, visitDiagnosisTable.tenantId)
      )
    )
    .leftJoin(
      ayurvedaDiagnosisCodeTable,
      and(
        eq(ayurvedaDiagnosisCodeTable.id, visitDiagnosisTable.ayurvedaDiagnosisCodeId),
        eq(ayurvedaDiagnosisCodeTable.tenantId, visitDiagnosisTable.tenantId)
      )
    )
    .leftJoin(
      icdMappingTable,
      and(
        eq(icdMappingTable.id, ayurvedaDiagnosisCodeTable.icdDiagnosisCodeId),
        eq(icdMappingTable.tenantId, visitDiagnosisTable.tenantId),
        eq(icdMappingTable.isDeleted, false)
      )
    )
    .where(
      and(
        eq(visitDiagnosisTable.tenantId, tenantId),
        eq(visitDiagnosisTable.visitId, visitId),
        eq(visitDiagnosisTable.isDeleted, false)
      )
    )
    .orderBy(
      sql`case ${visitDiagnosisTable.codeSystem} when 'ICD10CM' then 0 else 1 end`,
      sql`case ${visitDiagnosisTable.diagnosisType} when 'PRINCIPAL' then 0 else 1 end`,
      asc(visitDiagnosisTable.sortOrder),
      asc(visitDiagnosisTable.id)
    );

  return rows.map(
    ({ icdCode, icdTitle, ayurvedaCode, ayurvedaName, ayurvedaEnglishName, ...row }) => ({
      ...row,
      code: (row.codeSystem === 'ICD10CM' ? icdCode : ayurvedaCode) ?? '',
      title: (row.codeSystem === 'ICD10CM' ? icdTitle : ayurvedaName) ?? '',
      englishName: row.codeSystem === 'AYURVEDA' ? ayurvedaEnglishName : null,
      icdMapping: row.codeSystem === 'AYURVEDA' ? row.icdMapping : null,
    })
  );
}

// Includes deleted rows: the validator keeps a code the Visit already records.
async function getDiagnosisCodeReferences(
  tenantId: string,
  ids: number[]
): Promise<DiagnosisCodeReference[]> {
  if (ids.length === 0) {
    return [];
  }

  return db
    .select({
      id: diagnosisCodeTable.id,
      code: diagnosisCodeTable.code,
      isDeleted: diagnosisCodeTable.isDeleted,
    })
    .from(diagnosisCodeTable)
    .where(and(eq(diagnosisCodeTable.tenantId, tenantId), inArray(diagnosisCodeTable.id, ids)));
}

async function getAyurvedaDiagnosisCodeReferences(
  tenantId: string,
  ids: number[]
): Promise<DiagnosisCodeReference[]> {
  if (ids.length === 0) {
    return [];
  }

  return db
    .select({
      id: ayurvedaDiagnosisCodeTable.id,
      code: ayurvedaDiagnosisCodeTable.code,
      isDeleted: ayurvedaDiagnosisCodeTable.isDeleted,
    })
    .from(ayurvedaDiagnosisCodeTable)
    .where(
      and(
        eq(ayurvedaDiagnosisCodeTable.tenantId, tenantId),
        inArray(ayurvedaDiagnosisCodeTable.id, ids)
      )
    );
}

/**
 * Replaces a Visit's whole diagnosis list atomically: the current rows are soft
 * deleted and the new list is inserted in array order. Locking the Visit row
 * serialises concurrent saves of the same Visit.
 */
async function replaceVisitDiagnoses(
  tenantId: string,
  visitId: number,
  diagnoses: VisitDiagnosisEntry[]
): Promise<VisitDiagnosis[]> {
  await db.transaction(async (tx) => {
    const deletedOn = new Date();

    await tx
      .select({ id: visitTable.id })
      .from(visitTable)
      .where(and(eq(visitTable.id, visitId), eq(visitTable.tenantId, tenantId)))
      .for('update');

    await tx
      .update(visitDiagnosisTable)
      .set({ isDeleted: true, modifiedOn: deletedOn, deletedOn })
      .where(
        and(
          eq(visitDiagnosisTable.tenantId, tenantId),
          eq(visitDiagnosisTable.visitId, visitId),
          eq(visitDiagnosisTable.isDeleted, false)
        )
      );

    if (diagnoses.length === 0) {
      return;
    }

    await tx.insert(visitDiagnosisTable).values(
      diagnoses.map((diagnosis, index) => ({
        visitId,
        tenantId,
        notes: diagnosis.notes,
        sortOrder: index + 1,
        codeSystem: diagnosis.codeSystem,
        diagnosisType: diagnosis.diagnosisType,
        diagnosisCodeId: diagnosis.diagnosisCodeId,
        ayurvedaDiagnosisCodeId: diagnosis.ayurvedaDiagnosisCodeId,
      }))
    );
  });

  return listByVisit(tenantId, visitId);
}

export const visitDiagnosisRepository = {
  listByVisit,
  replaceVisitDiagnoses,
  getDiagnosisCodeReferences,
  getAyurvedaDiagnosisCodeReferences,
};
