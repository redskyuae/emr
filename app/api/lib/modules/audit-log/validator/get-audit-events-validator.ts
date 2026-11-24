import type { z } from 'zod';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  auditTenantIdSchema,
  exportAuditEventsSchema,
  listAuditEventsSchema,
  type AuditEventFilters,
  type AuditExportFormat,
} from '../schemas/audit-log-schema';

type ListFilters = AuditEventFilters & { page?: number; limit?: number };

function validate<T>(
  schema: z.ZodType<T>,
  filters: unknown,
  tenantId: unknown
): ValidationResult<T & { tenantId: string }> {
  const tenantIdResult = auditTenantIdSchema.safeParse(tenantId);
  const filtersResult = schema.safeParse(filters ?? {});

  if (!tenantIdResult.success || !filtersResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) errors.push(...formatValidationErrors(tenantIdResult.error));
    if (!filtersResult.success) errors.push(...formatValidationErrors(filtersResult.error));

    return { success: false, errors };
  }

  return { success: true, data: { ...filtersResult.data, tenantId: tenantIdResult.data } };
}

export function validateGetAuditEvents(filters: unknown, tenantId: unknown) {
  return validate<ListFilters>(listAuditEventsSchema, filters, tenantId);
}

export function validateExportAuditEvents(filters: unknown, tenantId: unknown) {
  return validate<AuditEventFilters & { format: AuditExportFormat }>(
    exportAuditEventsSchema,
    filters,
    tenantId
  );
}
