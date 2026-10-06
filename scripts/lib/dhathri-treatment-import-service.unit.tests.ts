import { describe, expect, it, vi } from 'vitest';

import type { DhathriWorkbookReadResult, DhathriWorkbookRow } from './dhathri-workbook-reader';
import type { DhathriTreatmentImportRepository } from './dhathri-treatment-import-repository';
import { runDhathriTreatmentImport } from './dhathri-treatment-import-service';

function sourceRow(sourceRowNumber: number, treatment = 'TRT001_Oil Therapy'): DhathriWorkbookRow {
  const values = {
    treatment,
    totalSession: '1',
    mrn: 'MRN-1',
    visitId: 'VISIT-1',
    visitNumber: '1001',
    treatmentStatus: 'Pending',
    sessionNumber: null,
    conductionNote: null,
    sessionStatus: 'Not Start',
  };
  return { sourceRowNumber, raw: values, normalized: values };
}

function workbook(rows = [sourceRow(2)]): DhathriWorkbookReadResult {
  return {
    workbookHash: 'a'.repeat(64),
    filename: 'synthetic.xlsx',
    headers: [],
    rows,
    structuralErrors: [],
  };
}

function repository(
  overrides: Partial<DhathriTreatmentImportRepository> = {}
): DhathriTreatmentImportRepository {
  return {
    tenantExists: vi.fn().mockResolvedValue(true),
    findCompletedBatch: vi.fn().mockResolvedValue(null),
    loadPatientMatches: vi.fn().mockResolvedValue(new Map([['MRN-1', [101]]])),
    loadExistingPlans: vi.fn().mockResolvedValue(new Map()),
    findPriorUnsafeImports: vi.fn().mockResolvedValue([]),
    commit: vi.fn().mockImplementation(async ({ expectedSummary }) => ({
      ...expectedSummary,
      status: 'COMPLETED',
      batchId: 1,
    })),
    ...overrides,
  };
}

describe('runDhathriTreatmentImport', () => {
  it('performs no write during a whole-workbook dry run', async () => {
    const repo = repository();
    const result = await runDhathriTreatmentImport(
      { tenantId: 'tenant-1', workbookPath: '/tmp/synthetic.xlsx', commit: false },
      { readWorkbook: vi.fn().mockResolvedValue(workbook()), repository: repo }
    );

    expect(result).toMatchObject({
      status: 'READY',
      sourceRowCount: 1,
      importedPlanCount: 1,
      importedRowCount: 1,
    });
    expect(repo.commit).not.toHaveBeenCalled();
  });

  it('keeps all Treatments for one Patient and Visit as independent Plans', async () => {
    const repo = repository();
    const result = await runDhathriTreatmentImport(
      { tenantId: 'tenant-1', workbookPath: '/tmp/synthetic.xlsx', commit: false },
      {
        readWorkbook: vi
          .fn()
          .mockResolvedValue(workbook([sourceRow(2), sourceRow(3, 'TRT002_Herbal Bandage')])),
        repository: repo,
      }
    );

    expect(result.importedPlanCount).toBe(2);
    expect(result.importedRowCount).toBe(2);
  });

  it('quarantines missing and changed Patient Treatment Plan matches', async () => {
    const changedHashByKey = new Map<string, string | null>();
    const repo = repository({
      loadPatientMatches: vi.fn().mockResolvedValue(new Map()),
      loadExistingPlans: vi.fn().mockImplementation(async (_tenantId, keys: string[]) => {
        changedHashByKey.set(keys[0], 'different');
        return changedHashByKey;
      }),
    });
    const result = await runDhathriTreatmentImport(
      { tenantId: 'tenant-1', workbookPath: '/tmp/synthetic.xlsx', commit: false },
      { readWorkbook: vi.fn().mockResolvedValue(workbook()), repository: repo }
    );

    expect(result).toMatchObject({
      quarantinedPlanCount: 1,
      reasonTotals: { MISSING_PATIENT_MRN_MATCH: 1 },
    });
  });

  it('stops a commit before batch creation when a retired unsafe import is detected', async () => {
    const repo = repository({
      findPriorUnsafeImports: vi
        .fn()
        .mockResolvedValue([
          { id: 8, code: 'TRT001', name: 'Oil Therapy', sessionCount: 1, reason: 'signature' },
        ]),
    });
    const result = await runDhathriTreatmentImport(
      { tenantId: 'tenant-1', workbookPath: '/tmp/synthetic.xlsx', commit: true },
      { readWorkbook: vi.fn().mockResolvedValue(workbook()), repository: repo }
    );

    expect(result).toMatchObject({
      status: 'BLOCKED',
      priorUnsafeImportCandidateCount: 1,
    });
    expect(repo.commit).not.toHaveBeenCalled();
  });

  it('returns an identical completed workbook as a no-op', async () => {
    const repo = repository({
      findCompletedBatch: vi.fn().mockResolvedValue({
        id: 4,
        importedRowCount: 1,
        skippedRowCount: 0,
        quarantinedRowCount: 0,
        importedPlanCount: 1,
        skippedPlanCount: 0,
        quarantinedPlanCount: 0,
      }),
    });
    const result = await runDhathriTreatmentImport(
      { tenantId: 'tenant-1', workbookPath: '/tmp/synthetic.xlsx', commit: true },
      { readWorkbook: vi.fn().mockResolvedValue(workbook()), repository: repo }
    );

    expect(result).toMatchObject({ status: 'NO_OP', batchId: 4 });
    expect(repo.commit).not.toHaveBeenCalled();
  });
});
