import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';

import { db } from '../../app/db';
import { organization } from '../../app/db/schema/auth';
import { patient } from '../../app/db/schema/patient';
import {
  patientTreatmentPlan,
  patientTreatmentPlanSession,
} from '../../app/db/schema/patient-treatment-plan';
import { treatmentImportBatch, treatmentImportRow } from '../../app/db/schema/treatment-import';
import { treatment, treatmentSession } from '../../app/db/schema/treatment';
import {
  detectPriorUnsafeImports,
  type PriorUnsafeImportCandidate,
  type TreatmentForUnsafeImportDetection,
} from './dhathri-old-import-detector';
import type { DhathriWorkbookReadResult, DhathriWorkbookRow } from './dhathri-workbook-reader';
import {
  sourceRowHash,
  type ImportPlanCandidate,
  type ImportPlanQuarantine,
  type ImportReason,
} from './dhathri-treatment-import-model';
import type { DhathriTreatmentImportSummary } from './dhathri-treatment-import-service';

export type ExistingImportBatch = {
  id: number;
  importedRowCount: number;
  skippedRowCount: number;
  quarantinedRowCount: number;
  importedPlanCount: number;
  skippedPlanCount: number;
  quarantinedPlanCount: number;
};

export type PreparedImportGroup = {
  candidate: ImportPlanCandidate;
  patientId: number | null;
  outcome: 'IMPORTED' | 'SKIPPED' | 'QUARANTINED';
  reasons: ImportReason[];
};

export type CommitImportInput = {
  tenantId: string;
  workbook: DhathriWorkbookReadResult;
  groups: PreparedImportGroup[];
  standaloneQuarantines: ImportPlanQuarantine[];
  expectedSummary: DhathriTreatmentImportSummary;
};

export type DhathriTreatmentImportRepository = {
  tenantExists(tenantId: string): Promise<boolean>;
  findCompletedBatch(tenantId: string, workbookSha256: string): Promise<ExistingImportBatch | null>;
  loadPatientMatches(tenantId: string, mrns: string[]): Promise<Map<string, number[]>>;
  loadExistingPlans(tenantId: string, keys: string[]): Promise<Map<string, string | null>>;
  findPriorUnsafeImports(
    tenantId: string,
    legacyTreatmentIdentities: string[]
  ): Promise<PriorUnsafeImportCandidate[]>;
  commit(input: CommitImportInput): Promise<DhathriTreatmentImportSummary>;
};

type AuditOutcome = 'IMPORTED' | 'SKIPPED' | 'QUARANTINED';
type CanonicalIds = {
  treatmentId?: number;
  planId?: number;
  sessionIdsByNumber?: Map<number, number>;
};

function auditValues(
  tenantId: string,
  batchId: number,
  rows: DhathriWorkbookRow[],
  outcome: AuditOutcome,
  reasons: ImportReason[],
  legacyPlanKey: string | null,
  legacyTreatmentIdentity: string | null,
  canonicalIds: CanonicalIds = {}
) {
  return rows.map((row) => {
    const raw = row.raw;
    const sessionNumber = row.normalized.sessionNumber;
    const parsedSessionNumber =
      sessionNumber !== null && /^[1-9]\d*$/u.test(sessionNumber) ? Number(sessionNumber) : null;
    return {
      tenantId,
      batchId,
      sheetName: 'TreatmentDetails',
      sourceRowNumber: row.sourceRowNumber,
      rowSha256: sourceRowHash(row),
      rawTreatment: raw.treatment,
      rawTotalSession: raw.totalSession,
      rawMrn: raw.mrn,
      rawVisitId: raw.visitId,
      rawVisitNumber: raw.visitNumber,
      rawTreatmentStatus: raw.treatmentStatus,
      rawSessionNumber: raw.sessionNumber,
      rawConductionNote: raw.conductionNote,
      rawSessionStatus: raw.sessionStatus,
      legacyTreatmentIdentity,
      legacyPlanKey,
      outcome,
      reasons,
      canonicalTreatmentId: canonicalIds.treatmentId,
      canonicalPatientTreatmentPlanId: canonicalIds.planId,
      canonicalPatientTreatmentPlanSessionId:
        parsedSessionNumber === null
          ? undefined
          : canonicalIds.sessionIdsByNumber?.get(parsedSessionNumber),
    };
  });
}

async function insertAuditRows(
  rows: ReturnType<typeof auditValues>,
  executor: Pick<typeof db, 'insert'> = db
) {
  if (rows.length > 0) await executor.insert(treatmentImportRow).values(rows);
}

async function persistCandidate(tenantId: string, batchId: number, group: PreparedImportGroup) {
  if (group.patientId === null) throw new Error('Resolved Patient is required');
  const candidate = group.candidate;
  const patientId = group.patientId;

  return await db.transaction(async (tx) => {
    let [canonicalTreatment] = await tx
      .select({ id: treatment.id })
      .from(treatment)
      .where(
        and(
          eq(treatment.tenantId, tenantId),
          eq(
            sql`lower(${treatment.legacySourceIdentity})`,
            candidate.treatmentIdentity.toLowerCase()
          ),
          eq(treatment.isDeleted, false)
        )
      )
      .limit(1);

    if (!canonicalTreatment) {
      [canonicalTreatment] = await tx
        .insert(treatment)
        .values({
          tenantId,
          name: candidate.treatmentName,
          code: candidate.treatmentCode,
          sessionStructure: 'REPEATABLE',
          defaultTotalSessions: null,
          legacySourceIdentity: candidate.treatmentIdentity,
          legacySourceSystem: 'DHATHRI',
          durationMinutes: null,
          setupMinutes: null,
          cleaningMinutes: null,
          roomType: null,
          therapistSkill: null,
        })
        .returning({ id: treatment.id });
    }

    let [template] = await tx
      .select({ id: treatmentSession.id })
      .from(treatmentSession)
      .where(
        and(
          eq(treatmentSession.tenantId, tenantId),
          eq(treatmentSession.treatmentId, canonicalTreatment.id),
          eq(treatmentSession.sessionNumber, 1),
          eq(treatmentSession.isDeleted, false)
        )
      )
      .limit(1);
    if (!template) {
      [template] = await tx
        .insert(treatmentSession)
        .values({
          tenantId,
          treatmentId: canonicalTreatment.id,
          sessionNumber: 1,
          label: candidate.treatmentName,
          procedure: candidate.treatmentName,
          durationMinutes: null,
          setupMinutes: null,
          cleaningMinutes: null,
          roomType: null,
          therapistSkill: null,
        })
        .returning({ id: treatmentSession.id });
    }

    const legacySourceIdentity = `${candidate.mrn}:${candidate.visitId}:${candidate.treatmentIdentity}`;
    const [plan] = await tx
      .insert(patientTreatmentPlan)
      .values({
        tenantId,
        patientId,
        treatmentId: canonicalTreatment.id,
        treatmentName: candidate.treatmentName,
        treatmentCode: candidate.treatmentCode,
        treatmentSourceIdentity: candidate.treatmentIdentity,
        sessionStructure: 'REPEATABLE',
        totalSessions: candidate.totalSessions,
        statusOverride: candidate.statusOverride,
        legacySourceIdentity,
        legacySourceSystem: 'DHATHRI',
        legacySourceKey: candidate.legacyPlanKey,
        legacySourceContentHash: candidate.contentHash,
        sourceImportBatchId: batchId,
        legacyVisitId: candidate.visitId,
        legacyVisitNumber: candidate.visitNumber,
        importBatchId: candidate.contentHash,
      })
      .returning({ id: patientTreatmentPlan.id });

    const insertedSessions = await tx
      .insert(patientTreatmentPlanSession)
      .values(
        candidate.sessions.map((session) => ({
          tenantId,
          patientTreatmentPlanId: plan.id,
          treatmentSessionId: template.id,
          sessionNumber: session.sessionNumber,
          label: candidate.treatmentName,
          procedure: candidate.treatmentName,
          durationMinutes: null,
          setupMinutes: null,
          cleaningMinutes: null,
          roomType: null,
          therapistSkill: null,
          legacyConductionNote: session.conductionNote,
          completionStatus: session.completionStatus,
          completionSource:
            session.completionStatus === 'COMPLETED' ? ('LEGACY_IMPORT' as const) : null,
        }))
      )
      .returning({
        id: patientTreatmentPlanSession.id,
        number: patientTreatmentPlanSession.sessionNumber,
      });
    const sessionIdsByNumber = new Map(
      insertedSessions.map((session) => [session.number, session.id])
    );

    await insertAuditRows(
      auditValues(
        tenantId,
        batchId,
        candidate.rows,
        'IMPORTED',
        [],
        candidate.legacyPlanKey,
        candidate.treatmentIdentity,
        { treatmentId: canonicalTreatment.id, planId: plan.id, sessionIdsByNumber }
      ),
      tx
    );
  });
}

async function commit(input: CommitImportInput): Promise<DhathriTreatmentImportSummary> {
  const { tenantId, workbook, groups, standaloneQuarantines } = input;
  const [batch] = await db
    .insert(treatmentImportBatch)
    .values({
      tenantId,
      sourceSystem: 'DHATHRI',
      originalFilename: workbook.filename,
      workbookSha256: workbook.workbookHash,
      status: 'RUNNING',
    })
    .returning({ id: treatmentImportBatch.id });

  const summary = {
    ...input.expectedSummary,
    reasonTotals: { ...input.expectedSummary.reasonTotals },
  };
  try {
    for (const quarantine of standaloneQuarantines) {
      await insertAuditRows(
        auditValues(
          tenantId,
          batch.id,
          quarantine.rows,
          'QUARANTINED',
          quarantine.reasons,
          quarantine.legacyPlanKey,
          quarantine.treatmentIdentity
        )
      );
    }

    for (const group of groups) {
      if (group.outcome !== 'IMPORTED') {
        await insertAuditRows(
          auditValues(
            tenantId,
            batch.id,
            group.candidate.rows,
            group.outcome,
            group.reasons,
            group.candidate.legacyPlanKey,
            group.candidate.treatmentIdentity
          )
        );
        continue;
      }

      try {
        await persistCandidate(tenantId, batch.id, group);
      } catch {
        const reasons = [
          {
            code: 'PERSISTENCE_VALIDATION_FAILURE',
            description: 'The canonical Treatment Plan graph could not be persisted',
          },
        ];
        await insertAuditRows(
          auditValues(
            tenantId,
            batch.id,
            group.candidate.rows,
            'QUARANTINED',
            reasons,
            group.candidate.legacyPlanKey,
            group.candidate.treatmentIdentity
          )
        );
        summary.importedPlanCount -= 1;
        summary.importedRowCount -= group.candidate.rows.length;
        summary.quarantinedPlanCount += 1;
        summary.quarantinedRowCount += group.candidate.rows.length;
        summary.reasonTotals.PERSISTENCE_VALIDATION_FAILURE =
          (summary.reasonTotals.PERSISTENCE_VALIDATION_FAILURE ?? 0) + group.candidate.rows.length;
      }
    }

    summary.status = summary.quarantinedPlanCount > 0 ? 'COMPLETED_WITH_QUARANTINE' : 'COMPLETED';
    summary.batchId = batch.id;
    await db
      .update(treatmentImportBatch)
      .set({
        status: summary.status,
        importedRowCount: summary.importedRowCount,
        skippedRowCount: summary.skippedRowCount,
        quarantinedRowCount: summary.quarantinedRowCount,
        importedPlanCount: summary.importedPlanCount,
        skippedPlanCount: summary.skippedPlanCount,
        quarantinedPlanCount: summary.quarantinedPlanCount,
        completedAt: new Date(),
        modifiedOn: new Date(),
      })
      .where(
        and(eq(treatmentImportBatch.tenantId, tenantId), eq(treatmentImportBatch.id, batch.id))
      );
    return summary;
  } catch (error) {
    await db
      .update(treatmentImportBatch)
      .set({
        status: 'FAILED',
        failureSummary: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown failure',
        completedAt: new Date(),
        modifiedOn: new Date(),
      })
      .where(
        and(eq(treatmentImportBatch.tenantId, tenantId), eq(treatmentImportBatch.id, batch.id))
      );
    throw error;
  }
}

export const dhathriTreatmentImportRepository: DhathriTreatmentImportRepository = {
  async tenantExists(tenantId) {
    const rows = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, tenantId))
      .limit(1);
    return rows.length === 1;
  },

  async findCompletedBatch(tenantId, workbookSha256) {
    const [batch] = await db
      .select({
        id: treatmentImportBatch.id,
        importedRowCount: treatmentImportBatch.importedRowCount,
        skippedRowCount: treatmentImportBatch.skippedRowCount,
        quarantinedRowCount: treatmentImportBatch.quarantinedRowCount,
        importedPlanCount: treatmentImportBatch.importedPlanCount,
        skippedPlanCount: treatmentImportBatch.skippedPlanCount,
        quarantinedPlanCount: treatmentImportBatch.quarantinedPlanCount,
      })
      .from(treatmentImportBatch)
      .where(
        and(
          eq(treatmentImportBatch.tenantId, tenantId),
          eq(treatmentImportBatch.sourceSystem, 'DHATHRI'),
          eq(treatmentImportBatch.workbookSha256, workbookSha256),
          or(
            eq(treatmentImportBatch.status, 'COMPLETED'),
            eq(treatmentImportBatch.status, 'COMPLETED_WITH_QUARANTINE')
          )
        )
      )
      .limit(1);
    return batch ?? null;
  },

  async loadPatientMatches(tenantId, mrns) {
    const result = new Map<string, number[]>();
    if (mrns.length === 0) return result;
    const rows = await db
      .select({ id: patient.id, mrn: patient.mrn })
      .from(patient)
      .where(
        and(
          eq(patient.tenantId, tenantId),
          eq(patient.isDeleted, false),
          inArray(sql<string>`upper(trim(${patient.mrn}))`, mrns)
        )
      );
    for (const row of rows) {
      const mrn = row.mrn.trim().toUpperCase();
      result.set(mrn, [...(result.get(mrn) ?? []), row.id]);
    }
    return result;
  },

  async loadExistingPlans(tenantId, keys) {
    const result = new Map<string, string | null>();
    if (keys.length === 0) return result;
    const rows = await db
      .select({
        key: patientTreatmentPlan.legacySourceKey,
        contentHash: patientTreatmentPlan.legacySourceContentHash,
      })
      .from(patientTreatmentPlan)
      .where(
        and(
          eq(patientTreatmentPlan.tenantId, tenantId),
          eq(patientTreatmentPlan.isDeleted, false),
          inArray(patientTreatmentPlan.legacySourceKey, keys)
        )
      );
    for (const row of rows) if (row.key) result.set(row.key, row.contentHash);
    return result;
  },

  async findPriorUnsafeImports(tenantId, legacyTreatmentIdentities) {
    if (legacyTreatmentIdentities.length === 0) return [];
    const rows = await db
      .select({
        id: treatment.id,
        code: treatment.code,
        name: treatment.name,
        legacySourceIdentity: treatment.legacySourceIdentity,
        durationMinutes: treatment.durationMinutes,
        setupMinutes: treatment.setupMinutes,
        cleaningMinutes: treatment.cleaningMinutes,
        roomType: treatment.roomType,
        therapistSkill: treatment.therapistSkill,
        sessionCount: sql<number>`count(${treatmentSession.id})::int`,
        matchingSessionMetadataCount: sql<number>`count(${treatmentSession.id}) filter (where
          ${treatmentSession.durationMinutes} = 60 and
          ${treatmentSession.setupMinutes} = 10 and
          ${treatmentSession.cleaningMinutes} = 5 and
          ${treatmentSession.roomType} = 'Panchakarma room' and
          ${treatmentSession.therapistSkill} = 'Abhyanga')::int`,
      })
      .from(treatment)
      .leftJoin(
        treatmentSession,
        and(
          eq(treatmentSession.tenantId, tenantId),
          eq(treatmentSession.treatmentId, treatment.id),
          eq(treatmentSession.isDeleted, false)
        )
      )
      .where(
        and(
          eq(treatment.tenantId, tenantId),
          eq(treatment.isDeleted, false),
          isNull(treatment.legacySourceIdentity)
        )
      )
      .groupBy(treatment.id);
    return detectPriorUnsafeImports(
      rows satisfies TreatmentForUnsafeImportDetection[],
      legacyTreatmentIdentities
    );
  },

  commit,
};
