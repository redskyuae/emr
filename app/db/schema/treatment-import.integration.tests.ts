import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { getDatabaseError } from '@/app/api/lib/utils/db-errors';
import { db } from '@/app/db';
import { patient as patientTable } from './patient';
import {
  patientTreatmentPlan as planTable,
  patientTreatmentPlanSession as planSessionTable,
} from './patient-treatment-plan';
import { treatment as treatmentTable } from './treatment';
import {
  treatmentImportBatch as batchTable,
  treatmentImportRow as rowTable,
} from './treatment-import';

const tenantA = 'tenant-import-a';
const tenantB = 'tenant-import-b';
const workbookSha256 = 'a'.repeat(64);

async function createBatch(tenantId: string, filename = 'synthetic-treatment-details.xlsx') {
  const [batch] = await db
    .insert(batchTable)
    .values({ tenantId, originalFilename: filename, workbookSha256 })
    .returning();
  return batch;
}

async function createPlanGraph(tenantId: string, sourceImportBatchId: number) {
  const [patient] = await db
    .insert(patientTable)
    .values({
      tenantId,
      mrn: 'SYNTH-MRN-001',
      firstName: 'Synthetic',
      lastName: 'Patient',
      phone: tenantId === tenantA ? '1000000001' : '1000000002',
    })
    .returning();
  const [treatment] = await db
    .insert(treatmentTable)
    .values({
      tenantId,
      name: 'Synthetic Therapy',
      code: 'SYN-THERAPY',
      sessionStructure: 'REPEATABLE',
    })
    .returning();
  const [plan] = await db
    .insert(planTable)
    .values({
      tenantId,
      patientId: patient.id,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      treatmentCode: treatment.code,
      sessionStructure: 'REPEATABLE',
      totalSessions: 1,
      legacySourceKey: 'f'.repeat(64),
      legacySourceContentHash: 'e'.repeat(64),
      sourceImportBatchId,
      legacyVisitId: 'SYNTH-VISIT-ID',
      legacyVisitNumber: 'SYNTH-VISIT-NUMBER',
    })
    .returning();
  const [session] = await db
    .insert(planSessionTable)
    .values({ tenantId, patientTreatmentPlanId: plan.id, sessionNumber: 1 })
    .returning();
  return { patient, treatment, plan, session };
}

describe('Treatment import audit database invariants', () => {
  it('should allow one committed workbook batch per Tenant and source system', async () => {
    await createBatch(tenantA);

    await expect(
      createBatch(tenantA, 'same-content-different-name.xlsx').catch(getDatabaseError)
    ).resolves.toMatchObject({
      code: '23505',
      constraint: 'treatment_import_batch_tenant_source_workbook_idx',
    });
    await expect(createBatch(tenantB)).resolves.toMatchObject({
      tenantId: tenantB,
      sourceSystem: 'DHATHRI',
      workbookSha256,
      status: 'RUNNING',
    });
  });

  it('should retain raw nullable values and normalized audit metadata without replacement', async () => {
    const batch = await createBatch(tenantA);
    const rawValues = {
      rawTreatment: '  SYN_Code_With_Underscores  ',
      rawTotalSession: ' 3 ',
      rawMrn: ' SYNTH-MRN-001 ',
      rawVisitId: ' SYNTH-VISIT-ID ',
      rawVisitNumber: null,
      rawTreatmentStatus: ' Progress ',
      rawSessionNumber: ' 1 ',
      rawConductionNote: 'NULL',
      rawSessionStatus: ' Completed ',
    };
    const reasons = [{ code: 'SYNTHETIC_CONFLICT', description: 'Synthetic quarantine reason.' }];
    const [saved] = await db
      .insert(rowTable)
      .values({
        tenantId: tenantA,
        batchId: batch.id,
        sheetName: 'TreatmentDetails',
        sourceRowNumber: 2,
        rowSha256: 'b'.repeat(64),
        ...rawValues,
        legacyTreatmentIdentity: 'SYN_Code_With_Underscores',
        legacyPlanKey: 'c'.repeat(64),
        outcome: 'QUARANTINED',
        reasons,
      })
      .returning();

    expect(saved).toMatchObject({
      ...rawValues,
      legacyTreatmentIdentity: 'SYN_Code_With_Underscores',
      legacyPlanKey: 'c'.repeat(64),
      outcome: 'QUARANTINED',
      reasons,
    });

    const [nullable] = await db
      .insert(rowTable)
      .values({
        tenantId: tenantA,
        batchId: batch.id,
        sheetName: 'TreatmentDetails',
        sourceRowNumber: 3,
        rowSha256: 'd'.repeat(64),
        rawTreatment: null,
        rawTotalSession: null,
        rawMrn: null,
        rawVisitId: null,
        rawVisitNumber: null,
        rawTreatmentStatus: null,
        rawSessionNumber: null,
        rawConductionNote: null,
        rawSessionStatus: null,
        outcome: 'SKIPPED',
      })
      .returning();
    expect(nullable).toMatchObject({
      rawTreatment: null,
      rawTotalSession: null,
      rawMrn: null,
      rawVisitId: null,
      rawVisitNumber: null,
      rawTreatmentStatus: null,
      rawSessionNumber: null,
      rawConductionNote: null,
      rawSessionStatus: null,
      reasons: [],
    });
  });

  it('should enforce source-row identity inside a batch but allow reuse by another Tenant', async () => {
    const firstBatch = await createBatch(tenantA);
    const secondBatch = await createBatch(tenantB);
    const values = {
      sheetName: 'TreatmentDetails',
      sourceRowNumber: 42,
      rowSha256: '1'.repeat(64),
      rawMrn: 'SYNTH-MRN-SHARED',
      legacyPlanKey: '2'.repeat(64),
      outcome: 'SKIPPED' as const,
    };
    await db.insert(rowTable).values({ tenantId: tenantA, batchId: firstBatch.id, ...values });

    await expect(
      db
        .insert(rowTable)
        .values({ tenantId: tenantA, batchId: firstBatch.id, ...values })
        .catch(getDatabaseError)
    ).resolves.toMatchObject({
      code: '23505',
      constraint: 'treatment_import_row_batch_sheet_number_idx',
    });
    await expect(
      db
        .insert(rowTable)
        .values({ tenantId: tenantB, batchId: secondBatch.id, ...values })
        .returning()
    ).resolves.toHaveLength(1);
  });

  it('should persist canonical references and Plan provenance with Tenant-scoped key uniqueness', async () => {
    const firstBatch = await createBatch(tenantA);
    const first = await createPlanGraph(tenantA, firstBatch.id);
    const [savedRow] = await db
      .insert(rowTable)
      .values({
        tenantId: tenantA,
        batchId: firstBatch.id,
        sheetName: 'TreatmentDetails',
        sourceRowNumber: 7,
        rowSha256: '7'.repeat(64),
        outcome: 'IMPORTED',
        canonicalTreatmentId: first.treatment.id,
        canonicalPatientTreatmentPlanId: first.plan.id,
        canonicalPatientTreatmentPlanSessionId: first.session.id,
      })
      .returning();
    expect(savedRow).toMatchObject({
      canonicalTreatmentId: first.treatment.id,
      canonicalPatientTreatmentPlanId: first.plan.id,
      canonicalPatientTreatmentPlanSessionId: first.session.id,
    });
    expect(first.plan).toMatchObject({
      legacySourceKey: 'f'.repeat(64),
      legacySourceContentHash: 'e'.repeat(64),
      sourceImportBatchId: firstBatch.id,
      legacyVisitId: 'SYNTH-VISIT-ID',
      legacyVisitNumber: 'SYNTH-VISIT-NUMBER',
    });

    await expect(
      db
        .insert(planTable)
        .values({
          tenantId: tenantA,
          patientId: first.patient.id,
          treatmentName: 'Conflicting synthetic plan',
          treatmentCode: 'SYN-CONFLICT',
          sessionStructure: 'REPEATABLE',
          totalSessions: 1,
          legacySourceKey: 'f'.repeat(64),
        })
        .catch(getDatabaseError)
    ).resolves.toMatchObject({
      code: '23505',
      constraint: 'patient_treatment_plan_tenant_legacy_source_key_idx',
    });

    await db
      .update(planTable)
      .set({ isDeleted: true, deletedOn: new Date() })
      .where(eq(planTable.id, first.plan.id));
    await expect(
      db
        .insert(planTable)
        .values({
          tenantId: tenantA,
          patientId: first.patient.id,
          treatmentName: 'Still conflicting after soft delete',
          treatmentCode: 'SYN-CONFLICT-2',
          sessionStructure: 'REPEATABLE',
          totalSessions: 1,
          legacySourceKey: 'f'.repeat(64),
        })
        .catch(getDatabaseError)
    ).resolves.toMatchObject({
      code: '23505',
      constraint: 'patient_treatment_plan_tenant_legacy_source_key_idx',
    });

    const secondBatch = await createBatch(tenantB);
    await expect(createPlanGraph(tenantB, secondBatch.id)).resolves.toMatchObject({
      plan: { legacySourceKey: 'f'.repeat(64) },
    });
  });
});
