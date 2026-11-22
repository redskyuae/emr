import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { AUDIT_ACTIONS } from '../schemas/audit-action-catalogue';
import { recordAuditEventSchema, type ValidatedAuditEvent } from '../schemas/audit-log-schema';

// The category and entity type come from the action catalogue, never the caller,
// so an action is always filed where the catalogue says it belongs.
export function validateRecordAuditEvent(input: unknown): ValidationResult<ValidatedAuditEvent> {
  const result = recordAuditEventSchema.safeParse(input);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const { category, entityType } = AUDIT_ACTIONS[result.data.action];

  return { success: true, data: { ...result.data, category, entityType } };
}
