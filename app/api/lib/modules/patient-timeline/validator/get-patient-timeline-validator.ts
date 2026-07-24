import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { patientRepository } from '../../patient/repository/patient-repository';
import {
  decodeTimelineCursor,
  patientTimelineFeedSchema,
  patientTimelineLimitSchema,
  patientTimelinePatientIdSchema,
  patientTimelineTenantIdSchema,
  type PatientTimelineParams,
} from '../schemas/patient-timeline-schema';

export type GetPatientTimelineInput = {
  feed?: unknown;
  limit?: unknown;
  cursor?: unknown;
};

export async function validateGetPatientTimeline(
  patientId: unknown,
  tenantId: unknown,
  input: GetPatientTimelineInput = {}
): Promise<ValidationResult<PatientTimelineParams>> {
  const patientIdResult = patientTimelinePatientIdSchema.safeParse(patientId);
  const tenantIdResult = patientTimelineTenantIdSchema.safeParse(tenantId);
  const feedResult = patientTimelineFeedSchema.safeParse(input.feed ?? undefined);
  const limitResult = patientTimelineLimitSchema.safeParse(input.limit ?? undefined);

  const errors: string[] = [];

  if (!patientIdResult.success) {
    errors.push(`Patient ${String(patientId)} is Invalid.`);
  }

  if (!tenantIdResult.success) {
    errors.push(...formatValidationErrors(tenantIdResult.error));
  }

  if (!feedResult.success) {
    errors.push(...formatValidationErrors(feedResult.error));
  }

  if (!limitResult.success) {
    errors.push(...formatValidationErrors(limitResult.error));
  }

  // A malformed cursor is a client error, not a crash — the value is opaque, so
  // the only sane response is to reject it rather than guess a position.
  const rawCursor = input.cursor ?? null;
  let cursor: PatientTimelineParams['cursor'] = null;

  if (rawCursor !== null && rawCursor !== undefined && rawCursor !== '') {
    if (typeof rawCursor !== 'string') {
      errors.push('Cursor is Invalid.');
    } else {
      cursor = decodeTimelineCursor(rawCursor);

      if (!cursor) {
        errors.push('Cursor is Invalid.');
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  if (!patientIdResult.success || !tenantIdResult.success || !feedResult.success) {
    return { success: false, errors };
  }

  if (!limitResult.success) {
    return { success: false, errors };
  }

  const patient = await patientRepository.getPatientById(patientIdResult.data, tenantIdResult.data);

  if (!patient) {
    return { success: false, errors: ['Patient not found'], status: StatusCodes.NOT_FOUND };
  }

  return {
    success: true,
    data: {
      feed: feedResult.data,
      limit: limitResult.data,
      cursor,
      tenantId: tenantIdResult.data,
      patientId: patientIdResult.data,
    },
  };
}
