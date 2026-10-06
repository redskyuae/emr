import { createHash } from 'node:crypto';

import type { DhathriWorkbookRow } from './dhathri-workbook-reader';

export type ImportReason = { code: string; description: string };

export type ImportSessionCandidate = {
  sessionNumber: number;
  completionStatus: 'PENDING' | 'COMPLETED';
  conductionNote: string | null;
};

export type ImportPlanCandidate = {
  rows: DhathriWorkbookRow[];
  mrn: string;
  visitId: string;
  visitNumber: string | null;
  treatmentIdentity: string;
  treatmentCode: string;
  treatmentName: string;
  totalSessions: number;
  statusOverride: 'STOPPED' | null;
  legacyPlanKey: string;
  contentHash: string;
  sessions: ImportSessionCandidate[];
};

export type ImportPlanQuarantine = {
  rows: DhathriWorkbookRow[];
  legacyPlanKey: string | null;
  treatmentIdentity: string | null;
  reasons: ImportReason[];
};

export type ImportAnalysis = {
  candidates: ImportPlanCandidate[];
  quarantines: ImportPlanQuarantine[];
};

const treatmentStatuses = {
  pending: 'PENDING',
  progress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  stop: 'STOPPED',
} as const;

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function sourceRowHash(row: DhathriWorkbookRow) {
  return hash(['TreatmentDetails', row.sourceRowNumber, row.raw]);
}

function positiveInteger(value: string | null) {
  if (value === null || !/^[1-9]\d*$/u.test(value)) return null;
  return Number(value);
}

function reason(code: string, description: string): ImportReason {
  return { code, description };
}

function parseTreatmentIdentity(value: string | null) {
  if (!value) return null;
  const separator = value.indexOf('_');
  const hasExplicitCode = separator > 0;
  const codeSource = hasExplicitCode ? value.slice(0, separator) : value;
  const nameSource = separator > 0 ? value.slice(separator + 1) : value;
  const normalizedCode = codeSource.toUpperCase().replace(/[^A-Z0-9_-]/gu, '');
  const code = hasExplicitCode
    ? normalizedCode
    : normalizedCode.slice(0, 20) || `LEGACY-${hash(value).slice(0, 10).toUpperCase()}`;
  const name = nameSource.trim();
  if (!code || code.length > 20 || !name || name.length > 200) return null;
  return { identity: value, code, name };
}

function groupKey(row: DhathriWorkbookRow) {
  const { mrn, visitId, treatment } = row.normalized;
  if (!mrn || !visitId || !treatment) return null;
  return JSON.stringify([mrn.toUpperCase(), visitId, treatment]);
}

function analyzeGroup(tenantId: string, rows: DhathriWorkbookRow[]) {
  const first = rows[0];
  const values = first.normalized;
  const parsedTreatment = parseTreatmentIdentity(values.treatment);
  const reasons: ImportReason[] = [];

  if (!values.mrn) reasons.push(reason('MISSING_MRN', 'Patient MRN is required'));
  if (!values.visitId) reasons.push(reason('MISSING_VISIT_ID', 'Legacy Visit ID is required'));
  if (!parsedTreatment)
    reasons.push(reason('INVALID_TREATMENT_IDENTITY', 'Treatment identity is invalid'));

  const totals = [...new Set(rows.map((row) => row.normalized.totalSession))];
  const totalSessions = totals.length === 1 ? positiveInteger(totals[0] ?? null) : null;
  if (totals.length > 1)
    reasons.push(
      reason('CONFLICTING_TOTAL_SESSION', 'Rows contain different Total Session values')
    );
  else if (totalSessions === null)
    reasons.push(reason('INVALID_TOTAL_SESSION', 'Total Session must be a positive integer'));

  const visitNumbers = [
    ...new Set(rows.map((row) => row.normalized.visitNumber).filter((value) => value !== null)),
  ];
  if (visitNumbers.length > 1)
    reasons.push(reason('CONFLICTING_VISIT_NUMBER', 'Rows contain different Visit Numbers'));

  const statuses = [
    ...new Set(rows.map((row) => row.normalized.treatmentStatus?.toLowerCase() ?? '')),
  ];
  const planStatus =
    statuses.length === 1
      ? treatmentStatuses[statuses[0] as keyof typeof treatmentStatuses]
      : undefined;
  if (statuses.length > 1)
    reasons.push(
      reason('CONFLICTING_TREATMENT_STATUS', 'Rows contain different Treatment statuses')
    );
  else if (!planStatus)
    reasons.push(reason('INVALID_TREATMENT_STATUS', 'Treatment status is not supported'));

  const numberedRows = rows.filter((row) => row.normalized.sessionNumber !== null);
  const sessionNumbers = numberedRows.map((row) => positiveInteger(row.normalized.sessionNumber));
  if (
    sessionNumbers.some(
      (number) => number === null || (totalSessions !== null && number > totalSessions)
    )
  ) {
    reasons.push(reason('INVALID_SESSION_NUMBER', 'Session Number must be within Total Session'));
  }
  const validNumbers = sessionNumbers.filter((number): number is number => number !== null);
  if (new Set(validNumbers).size !== validNumbers.length)
    reasons.push(
      reason('DUPLICATE_SESSION_NUMBER', 'Session Numbers must be unique within a Plan')
    );

  const rowBySession = new Map<number, DhathriWorkbookRow>();
  for (let index = 0; index < numberedRows.length; index += 1) {
    const number = sessionNumbers[index];
    if (number !== null) rowBySession.set(number, numberedRows[index]);
  }

  const sessions: ImportSessionCandidate[] = Array.from(
    { length: totalSessions ?? 0 },
    (_, index) => {
      const sessionNumber = index + 1;
      const row = rowBySession.get(sessionNumber);
      const sessionStatus = row?.normalized.sessionStatus?.toLowerCase() ?? null;
      const completionStatus = sessionStatus === 'completed' ? 'COMPLETED' : 'PENDING';
      if (
        sessionStatus !== null &&
        !['completed', 'not start', 'pending', 'cancel'].includes(sessionStatus)
      ) {
        reasons.push(reason('INVALID_SESSION_STATUS', 'Session status is not supported'));
      }
      return {
        sessionNumber,
        completionStatus,
        conductionNote: row?.normalized.conductionNote ?? null,
      };
    }
  );

  const completed = sessions.filter((session) => session.completionStatus === 'COMPLETED').length;
  const contradicts =
    (planStatus === 'PENDING' && completed > 0) ||
    (planStatus === 'IN_PROGRESS' && (completed === 0 || completed === sessions.length)) ||
    (planStatus === 'COMPLETED' && completed !== sessions.length);
  if (contradicts)
    reasons.push(
      reason('STATUS_SESSION_CONTRADICTION', 'Treatment status contradicts Session completion')
    );

  const mrn = values.mrn?.toUpperCase() ?? null;
  const legacyPlanKey =
    mrn && values.visitId && parsedTreatment
      ? hash([tenantId, mrn, values.visitId, parsedTreatment.identity])
      : null;

  if (
    reasons.length > 0 ||
    !mrn ||
    !values.visitId ||
    !parsedTreatment ||
    totalSessions === null ||
    !planStatus ||
    !legacyPlanKey
  ) {
    return {
      quarantine: {
        rows,
        legacyPlanKey,
        treatmentIdentity: parsedTreatment?.identity ?? null,
        reasons,
      } satisfies ImportPlanQuarantine,
    };
  }

  const normalizedRows = rows
    .map((row) => [row.sourceRowNumber, row.normalized])
    .sort((left, right) => Number(left[0]) - Number(right[0]));
  return {
    candidate: {
      rows,
      mrn,
      visitId: values.visitId,
      visitNumber: visitNumbers[0] ?? null,
      treatmentIdentity: parsedTreatment.identity,
      treatmentCode: parsedTreatment.code,
      treatmentName: parsedTreatment.name,
      totalSessions,
      statusOverride: planStatus === 'STOPPED' ? 'STOPPED' : null,
      legacyPlanKey,
      contentHash: hash(normalizedRows),
      sessions,
    } satisfies ImportPlanCandidate,
  };
}

export function analyzeDhathriTreatmentRows(
  tenantId: string,
  rows: DhathriWorkbookRow[]
): ImportAnalysis {
  const grouped = new Map<string, DhathriWorkbookRow[]>();
  const quarantines: ImportPlanQuarantine[] = [];

  for (const row of rows) {
    const key = groupKey(row);
    if (!key) {
      const result = analyzeGroup(tenantId, [row]);
      if (result.quarantine) quarantines.push(result.quarantine);
      continue;
    }
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  const candidates: ImportPlanCandidate[] = [];
  for (const rowsInGroup of grouped.values()) {
    const result = analyzeGroup(tenantId, rowsInGroup);
    if (result.candidate) candidates.push(result.candidate);
    else if (result.quarantine) quarantines.push(result.quarantine);
  }

  candidates.sort((left, right) => left.legacyPlanKey.localeCompare(right.legacyPlanKey));
  return { candidates, quarantines };
}
