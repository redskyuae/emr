import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import { allergen as allergenTable } from '@/app/db/schema/allergen';
import { user as userTable } from '@/app/db/schema/auth';
import { clinicalNote as clinicalNoteTable } from '@/app/db/schema/clinical-note';
import { clinicalNoteType as clinicalNoteTypeTable } from '@/app/db/schema/clinical-note-type';
import { invoice as invoiceTable } from '@/app/db/schema/invoice';
import { patientAllergy as patientAllergyTable } from '@/app/db/schema/patient-allergy';
import { patientVitalSign as patientVitalSignTable } from '@/app/db/schema/patient-vital-sign';
import type { AllergySeverity } from '../../patient-allergy/schemas/patient-allergy-schema';
import type {
  VisitSummaryAllergy,
  VisitSummaryNote,
  VisitSummaryVitalSign,
} from '../schemas/visit-summary-schema';

// Signed Clinical Notes of one Visit, oldest first. Drafts are never printed.
async function getSignedVisitNotes(tenantId: string, visitId: number): Promise<VisitSummaryNote[]> {
  const rows = await db
    .select({
      id: clinicalNoteTable.id,
      plan: clinicalNoteTable.plan,
      signedAt: clinicalNoteTable.signedAt,
      amendedAt: clinicalNoteTable.amendedAt,
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
        eq(clinicalNoteTable.visitId, visitId),
        eq(clinicalNoteTable.status, 'signed'),
        eq(clinicalNoteTable.isDeleted, false)
      )
    )
    .orderBy(asc(clinicalNoteTable.signedAt), asc(clinicalNoteTable.id));

  return rows.map(({ noteTypeName, noteTypeCode, ...note }) => ({
    ...note,
    noteType: { name: noteTypeName, code: noteTypeCode },
  }));
}

// The most recent Vital Signs set recorded in one Visit.
async function getLatestVisitVitalSign(
  tenantId: string,
  visitId: number
): Promise<VisitSummaryVitalSign | undefined> {
  const [row] = await db
    .select({
      id: patientVitalSignTable.id,
      bmi: patientVitalSignTable.bmi,
      spo2: patientVitalSignTable.spo2,
      heightCm: patientVitalSignTable.heightCm,
      weightKg: patientVitalSignTable.weightKg,
      systolic: patientVitalSignTable.systolic,
      pulseBpm: patientVitalSignTable.pulseBpm,
      respRate: patientVitalSignTable.respRate,
      diastolic: patientVitalSignTable.diastolic,
      painScore: patientVitalSignTable.painScore,
      recordedAt: patientVitalSignTable.recordedAt,
      temperatureC: patientVitalSignTable.temperatureC,
    })
    .from(patientVitalSignTable)
    .where(
      and(
        eq(patientVitalSignTable.tenantId, tenantId),
        eq(patientVitalSignTable.visitId, visitId),
        eq(patientVitalSignTable.isDeleted, false)
      )
    )
    .orderBy(desc(patientVitalSignTable.recordedAt), desc(patientVitalSignTable.id))
    .limit(1);

  return row;
}

// Active allergies, most severe first. The name is the Allergen's, or the free-text substance.
async function getActivePatientAllergies(
  tenantId: string,
  patientId: number
): Promise<VisitSummaryAllergy[]> {
  const severityRank = sql`case ${patientAllergyTable.severity}
    when 'severe' then 0 when 'moderate' then 1 else 2 end`;

  return db
    .select({
      id: patientAllergyTable.id,
      name: sql<string>`coalesce(${allergenTable.name}, ${patientAllergyTable.substance}, 'Unspecified')`,
      reaction: patientAllergyTable.reaction,
      severity: sql<AllergySeverity>`${patientAllergyTable.severity}`,
    })
    .from(patientAllergyTable)
    .leftJoin(
      allergenTable,
      and(
        eq(allergenTable.id, patientAllergyTable.allergenId),
        eq(allergenTable.tenantId, patientAllergyTable.tenantId)
      )
    )
    .where(
      and(
        eq(patientAllergyTable.tenantId, tenantId),
        eq(patientAllergyTable.patientId, patientId),
        eq(patientAllergyTable.status, 'active'),
        eq(patientAllergyTable.isDeleted, false)
      )
    )
    .orderBy(asc(severityRank), asc(patientAllergyTable.id));
}

// The latest Invoice raised for one Visit, ignoring Void Invoices.
async function getVisitInvoiceId(tenantId: string, visitId: number): Promise<number | undefined> {
  const [row] = await db
    .select({ id: invoiceTable.id })
    .from(invoiceTable)
    .where(
      and(
        eq(invoiceTable.tenantId, tenantId),
        eq(invoiceTable.visitId, visitId),
        ne(invoiceTable.status, 'VOID'),
        eq(invoiceTable.isDeleted, false)
      )
    )
    .orderBy(desc(invoiceTable.createdOn), desc(invoiceTable.id))
    .limit(1);

  return row?.id;
}

export const visitSummaryRepository = {
  getVisitInvoiceId,
  getSignedVisitNotes,
  getLatestVisitVitalSign,
  getActivePatientAllergies,
};
