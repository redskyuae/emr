import { and, asc, desc, eq, inArray, isNotNull } from 'drizzle-orm';

import { db } from '@/app/db';
import { user as userTable } from '@/app/db/schema/auth';
import { clinicalNote as clinicalNoteTable } from '@/app/db/schema/clinical-note';
import { clinicalNoteType as clinicalNoteTypeTable } from '@/app/db/schema/clinical-note-type';
import { patientVitalSign as patientVitalSignTable } from '@/app/db/schema/patient-vital-sign';
import type { ConsolidatedReportNote } from '../schemas/consolidated-patient-report-schema';

type VisitPainScore = {
  visitId: number;
  painScore: number;
};

// Signed Clinical Notes of the given Visits, oldest first. Drafts are never reported.
async function getSignedNotesForVisits(
  tenantId: string,
  visitIds: number[]
): Promise<ConsolidatedReportNote[]> {
  if (visitIds.length === 0) return [];

  const rows = await db
    .select({
      id: clinicalNoteTable.id,
      plan: clinicalNoteTable.plan,
      visitId: clinicalNoteTable.visitId,
      signedAt: clinicalNoteTable.signedAt,
      objective: clinicalNoteTable.objective,
      subjective: clinicalNoteTable.subjective,
      assessment: clinicalNoteTable.assessment,
      authorName: userTable.name,
      noteTypeName: clinicalNoteTypeTable.name,
      noteTypeCode: clinicalNoteTypeTable.code,
    })
    .from(clinicalNoteTable)
    .innerJoin(
      clinicalNoteTypeTable,
      and(
        eq(clinicalNoteTypeTable.id, clinicalNoteTable.noteTypeId),
        eq(clinicalNoteTypeTable.tenantId, clinicalNoteTable.tenantId)
      )
    )
    .leftJoin(userTable, eq(userTable.id, clinicalNoteTable.authorUserId))
    .where(
      and(
        eq(clinicalNoteTable.tenantId, tenantId),
        inArray(clinicalNoteTable.visitId, visitIds),
        eq(clinicalNoteTable.status, 'signed'),
        eq(clinicalNoteTable.isDeleted, false)
      )
    )
    .orderBy(asc(clinicalNoteTable.signedAt), asc(clinicalNoteTable.id));

  return rows.map(({ noteTypeName, noteTypeCode, visitId, ...note }) => ({
    ...note,
    visitId: visitId as number,
    noteType: { name: noteTypeName, code: noteTypeCode },
  }));
}

// The pain score of the latest Vital Signs set that recorded one, for each of the given Visits.
async function getLatestPainScoresForVisits(
  tenantId: string,
  visitIds: number[]
): Promise<VisitPainScore[]> {
  if (visitIds.length === 0) return [];

  const rows = await db
    .selectDistinctOn([patientVitalSignTable.visitId], {
      visitId: patientVitalSignTable.visitId,
      painScore: patientVitalSignTable.painScore,
    })
    .from(patientVitalSignTable)
    .where(
      and(
        eq(patientVitalSignTable.tenantId, tenantId),
        inArray(patientVitalSignTable.visitId, visitIds),
        isNotNull(patientVitalSignTable.painScore),
        eq(patientVitalSignTable.isDeleted, false)
      )
    )
    .orderBy(
      patientVitalSignTable.visitId,
      desc(patientVitalSignTable.recordedAt),
      desc(patientVitalSignTable.id)
    );

  return rows.map((row) => ({
    visitId: row.visitId as number,
    painScore: row.painScore as number,
  }));
}

export const consolidatedPatientReportRepository = {
  getSignedNotesForVisits,
  getLatestPainScoresForVisits,
};
