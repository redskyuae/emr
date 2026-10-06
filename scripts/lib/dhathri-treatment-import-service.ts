import type { DhathriWorkbookReadResult } from './dhathri-workbook-reader';
import { readDhathriWorkbook } from './dhathri-workbook-reader';
import {
  analyzeDhathriTreatmentRows,
  type ImportPlanCandidate,
  type ImportPlanQuarantine,
  type ImportReason,
} from './dhathri-treatment-import-model';
import {
  dhathriTreatmentImportRepository,
  type DhathriTreatmentImportRepository,
  type ExistingImportBatch,
  type PreparedImportGroup,
} from './dhathri-treatment-import-repository';

export type DhathriTreatmentImportOptions = {
  tenantId: string;
  workbookPath: string;
  commit: boolean;
};

export type DhathriTreatmentImportSummary = {
  mode: 'DRY_RUN' | 'COMMIT';
  status: 'READY' | 'NO_OP' | 'BLOCKED' | 'COMPLETED' | 'COMPLETED_WITH_QUARANTINE';
  workbookSha256: string;
  sourceRowCount: number;
  importedRowCount: number;
  skippedRowCount: number;
  quarantinedRowCount: number;
  importedPlanCount: number;
  skippedPlanCount: number;
  quarantinedPlanCount: number;
  reasonTotals: Record<string, number>;
  priorUnsafeImportCandidateCount: number;
  batchId: number | null;
};

export type DhathriTreatmentImportDependencies = {
  readWorkbook: (path: string) => Promise<DhathriWorkbookReadResult>;
  repository: DhathriTreatmentImportRepository;
};

function addReasonTotal(totals: Record<string, number>, reasons: ImportReason[], rowCount: number) {
  for (const item of reasons) totals[item.code] = (totals[item.code] ?? 0) + rowCount;
}

function priorBatchSummary(
  workbook: DhathriWorkbookReadResult,
  batch: ExistingImportBatch,
  commit: boolean
): DhathriTreatmentImportSummary {
  return {
    mode: commit ? 'COMMIT' : 'DRY_RUN',
    status: 'NO_OP',
    workbookSha256: workbook.workbookHash,
    sourceRowCount: workbook.rows.length,
    importedRowCount: batch.importedRowCount,
    skippedRowCount: batch.skippedRowCount,
    quarantinedRowCount: batch.quarantinedRowCount,
    importedPlanCount: batch.importedPlanCount,
    skippedPlanCount: batch.skippedPlanCount,
    quarantinedPlanCount: batch.quarantinedPlanCount,
    reasonTotals: {},
    priorUnsafeImportCandidateCount: 0,
    batchId: batch.id,
  };
}

function summarizePrepared(
  workbook: DhathriWorkbookReadResult,
  groups: PreparedImportGroup[],
  standaloneQuarantines: ImportPlanQuarantine[],
  priorUnsafeImportCandidateCount: number,
  commit: boolean
): DhathriTreatmentImportSummary {
  const reasonTotals: Record<string, number> = {};
  let importedRowCount = 0;
  let skippedRowCount = 0;
  let quarantinedRowCount = 0;
  let importedPlanCount = 0;
  let skippedPlanCount = 0;
  let quarantinedPlanCount = standaloneQuarantines.length;

  for (const quarantine of standaloneQuarantines) {
    quarantinedRowCount += quarantine.rows.length;
    addReasonTotal(reasonTotals, quarantine.reasons, quarantine.rows.length);
  }
  for (const group of groups) {
    if (group.outcome === 'IMPORTED') {
      importedPlanCount += 1;
      importedRowCount += group.candidate.rows.length;
    } else if (group.outcome === 'SKIPPED') {
      skippedPlanCount += 1;
      skippedRowCount += group.candidate.rows.length;
    } else {
      quarantinedPlanCount += 1;
      quarantinedRowCount += group.candidate.rows.length;
      addReasonTotal(reasonTotals, group.reasons, group.candidate.rows.length);
    }
  }

  if (priorUnsafeImportCandidateCount > 0) {
    reasonTotals.PRIOR_UNSAFE_IMPORT_DETECTED = priorUnsafeImportCandidateCount;
  }

  return {
    mode: commit ? 'COMMIT' : 'DRY_RUN',
    status: priorUnsafeImportCandidateCount > 0 ? 'BLOCKED' : 'READY',
    workbookSha256: workbook.workbookHash,
    sourceRowCount: workbook.rows.length,
    importedRowCount,
    skippedRowCount,
    quarantinedRowCount,
    importedPlanCount,
    skippedPlanCount,
    quarantinedPlanCount,
    reasonTotals: Object.fromEntries(
      Object.entries(reasonTotals).sort(([left], [right]) => left.localeCompare(right))
    ),
    priorUnsafeImportCandidateCount,
    batchId: null,
  };
}

function structuralQuarantines(workbook: DhathriWorkbookReadResult): ImportPlanQuarantine[] {
  if (workbook.structuralErrors.length === 0) return [];
  const reasons = workbook.structuralErrors.map((error) => ({
    code: 'STRUCTURAL_PARSE_FAILURE',
    description: error.message,
  }));
  return workbook.rows.map((row) => ({
    rows: [row],
    legacyPlanKey: null,
    treatmentIdentity: row.normalized.treatment,
    reasons,
  }));
}

function patientReason(matchCount: number): ImportReason {
  if (matchCount === 0) {
    return {
      code: 'MISSING_PATIENT_MRN_MATCH',
      description: 'No Patient matches the normalized MRN in the target Tenant',
    };
  }
  return {
    code: 'AMBIGUOUS_PATIENT_MRN_MATCH',
    description: 'More than one Patient matches the normalized MRN in the target Tenant',
  };
}

function prepareGroups(
  candidates: ImportPlanCandidate[],
  patientsByMrn: Map<string, number[]>,
  existingPlans: Map<string, string | null>
): PreparedImportGroup[] {
  return candidates.map((candidate) => {
    const patientIds = patientsByMrn.get(candidate.mrn) ?? [];
    if (patientIds.length !== 1) {
      return {
        candidate,
        patientId: null,
        outcome: 'QUARANTINED',
        reasons: [patientReason(patientIds.length)],
      };
    }

    const existingContentHash = existingPlans.get(candidate.legacyPlanKey);
    if (existingContentHash !== undefined) {
      if (existingContentHash === candidate.contentHash) {
        return {
          candidate,
          patientId: patientIds[0],
          outcome: 'SKIPPED',
          reasons: [
            {
              code: 'IDENTICAL_EXISTING_PLAN',
              description: 'An identical imported Patient Treatment Plan already exists',
            },
          ],
        };
      }
      return {
        candidate,
        patientId: patientIds[0],
        outcome: 'QUARANTINED',
        reasons: [
          {
            code: 'CHANGED_EXISTING_PLAN',
            description: 'The source differs from an existing imported Patient Treatment Plan',
          },
        ],
      };
    }

    return { candidate, patientId: patientIds[0], outcome: 'IMPORTED', reasons: [] };
  });
}

export async function runDhathriTreatmentImport(
  options: DhathriTreatmentImportOptions,
  dependencies: DhathriTreatmentImportDependencies = {
    readWorkbook: readDhathriWorkbook,
    repository: dhathriTreatmentImportRepository,
  }
): Promise<DhathriTreatmentImportSummary> {
  const tenantId = options.tenantId.trim();
  const workbookPath = options.workbookPath.trim();
  if (!tenantId) throw new Error('Tenant ID is required');
  if (!workbookPath) throw new Error('Workbook path is required');

  const workbook = await dependencies.readWorkbook(workbookPath);
  if (!(await dependencies.repository.tenantExists(tenantId))) {
    throw new Error('Target Tenant does not exist');
  }

  const priorBatch = await dependencies.repository.findCompletedBatch(
    tenantId,
    workbook.workbookHash
  );
  if (priorBatch) return priorBatchSummary(workbook, priorBatch, options.commit);

  const structural = structuralQuarantines(workbook);
  const analysis = structural.length
    ? { candidates: [], quarantines: structural }
    : analyzeDhathriTreatmentRows(tenantId, workbook.rows);
  const mrns = [...new Set(analysis.candidates.map((candidate) => candidate.mrn))];
  const keys = analysis.candidates.map((candidate) => candidate.legacyPlanKey);
  const identities = [
    ...new Set(analysis.candidates.map((candidate) => candidate.treatmentIdentity)),
  ];
  const [patientsByMrn, existingPlans, priorUnsafeImports] = await Promise.all([
    dependencies.repository.loadPatientMatches(tenantId, mrns),
    dependencies.repository.loadExistingPlans(tenantId, keys),
    dependencies.repository.findPriorUnsafeImports(tenantId, identities),
  ]);
  const groups = prepareGroups(analysis.candidates, patientsByMrn, existingPlans);
  const preparedSummary = summarizePrepared(
    workbook,
    groups,
    analysis.quarantines,
    priorUnsafeImports.length,
    options.commit
  );

  if (!options.commit || preparedSummary.status === 'BLOCKED') return preparedSummary;

  return await dependencies.repository.commit({
    tenantId,
    workbook,
    groups,
    standaloneQuarantines: analysis.quarantines,
    expectedSummary: preparedSummary,
  });
}
