import type { CursorPaginated, SingleQueryResult } from '@/app/api/lib/utils/types';
import { patientTimelineRepository } from '../repository/patient-timeline-repository';
import {
  encodeTimelineCursor,
  type TimelineEvent,
  type TimelineEventRow,
} from '../schemas/patient-timeline-schema';
import {
  validateGetPatientTimeline,
  type GetPatientTimelineInput,
} from '../validator/get-patient-timeline-validator';

function toTimelineEvent(row: TimelineEventRow): TimelineEvent {
  const base = {
    sourceId: row.sourceId,
    eventType: row.eventType,
    occurredAt: new Date(row.occurredAt).toISOString(),
    reference: row.reference,
  };

  switch (row.sourceType) {
    case 'PATIENT':
      return { ...base, sourceType: 'PATIENT' };

    case 'CLINICAL_NOTE':
      return { ...base, sourceType: 'CLINICAL_NOTE', detail: row.detail };

    case 'INVOICE':
      return {
        ...base,
        sourceType: 'INVOICE',
        amount: row.amount === null ? null : Number(row.amount),
      };

    case 'BED_TRANSFER':
      return {
        ...base,
        sourceType: 'BED_TRANSFER',
        detail: row.detail,
        parentId: row.parentId ?? 0,
      };

    case 'PAYMENT':
      return {
        ...base,
        sourceType: 'PAYMENT',
        amount: row.amount === null ? null : Number(row.amount),
        detail: row.detail,
        parentId: row.parentId ?? 0,
      };

    case 'VISIT_DOCUMENT':
      return {
        ...base,
        sourceType: 'VISIT_DOCUMENT',
        detail: row.detail,
        detailCount: row.detailCount ?? 0,
      };

    case 'APPOINTMENT':
      return {
        ...base,
        sourceType: 'APPOINTMENT',
        detail: row.detail,
        doctorName: row.doctorName,
      };

    case 'VISIT':
      return { ...base, sourceType: 'VISIT', doctorName: row.doctorName };

    case 'ADMISSION':
      return { ...base, sourceType: 'ADMISSION', doctorName: row.doctorName };
  }
}

export async function getPatientTimelineQuery(
  patientId: unknown,
  tenantId: unknown,
  input: GetPatientTimelineInput = {}
): Promise<SingleQueryResult<CursorPaginated<TimelineEvent>>> {
  const validationResult = await validateGetPatientTimeline(patientId, tenantId, input);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const params = validationResult.data;
  const rows = await patientTimelineRepository.getPatientTimeline(params);

  // The repository fetches limit + 1 purely to detect a further page; that probe
  // row never reaches the client.
  const hasNextPage = rows.length > params.limit;
  const pageRows = hasNextPage ? rows.slice(0, params.limit) : rows;
  const lastRow = pageRows.at(-1);

  const nextCursor =
    hasNextPage && lastRow
      ? encodeTimelineCursor({
          occurredAt: new Date(lastRow.occurredAt),
          sourceType: lastRow.sourceType,
          sourceId: lastRow.sourceId,
        })
      : null;

  return {
    success: true,
    data: {
      data: pageRows.map(toTimelineEvent),
      meta: { nextCursor },
    },
  };
}
