import type { z } from 'zod';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { auditTenantIdSchema, type AuditExportFormat } from '../schemas/audit-log-schema';
import {
  exportUserAuditDetailSchema,
  exportUserAuditListSchema,
  listUserAuditSchema,
  userAuditDetailSchema,
  userAuditUserIdSchema,
} from '../schemas/user-audit-schema';

type DetailFilters = { fromDate?: string; toDate?: string };
type ListFilters = DetailFilters & { query?: string; page?: number; limit?: number };
type Exported<T> = T & { format: AuditExportFormat };

function validateList<T>(
  schema: z.ZodType<T>,
  filters: unknown,
  tenantId: unknown
): ValidationResult<T & { tenantId: string }> {
  const tenantIdResult = auditTenantIdSchema.safeParse(tenantId);
  const filtersResult = schema.safeParse(filters ?? {});

  if (!tenantIdResult.success || !filtersResult.success) {
    return {
      success: false,
      errors: [
        ...(tenantIdResult.success ? [] : formatValidationErrors(tenantIdResult.error)),
        ...(filtersResult.success ? [] : formatValidationErrors(filtersResult.error)),
      ],
    };
  }

  return { success: true, data: { ...filtersResult.data, tenantId: tenantIdResult.data } };
}

function validateDetail<T>(
  schema: z.ZodType<T>,
  userId: unknown,
  filters: unknown,
  tenantId: unknown
): ValidationResult<T & { tenantId: string; userId: string }> {
  const tenantIdResult = auditTenantIdSchema.safeParse(tenantId);
  const userIdResult = userAuditUserIdSchema.safeParse(userId);
  const filtersResult = schema.safeParse(filters ?? {});

  if (!tenantIdResult.success || !userIdResult.success || !filtersResult.success) {
    return {
      success: false,
      errors: [
        ...(tenantIdResult.success ? [] : formatValidationErrors(tenantIdResult.error)),
        ...(userIdResult.success ? [] : formatValidationErrors(userIdResult.error)),
        ...(filtersResult.success ? [] : formatValidationErrors(filtersResult.error)),
      ],
    };
  }

  return {
    success: true,
    data: { ...filtersResult.data, tenantId: tenantIdResult.data, userId: userIdResult.data },
  };
}

export function validateGetUserAuditList(filters: unknown, tenantId: unknown) {
  return validateList<ListFilters>(listUserAuditSchema, filters, tenantId);
}

export function validateExportUserAuditList(filters: unknown, tenantId: unknown) {
  return validateList<Exported<Omit<ListFilters, 'page' | 'limit'>>>(
    exportUserAuditListSchema,
    filters,
    tenantId
  );
}

export function validateGetUserAuditDetail(userId: unknown, filters: unknown, tenantId: unknown) {
  return validateDetail<DetailFilters>(userAuditDetailSchema, userId, filters, tenantId);
}

export function validateExportUserAuditDetail(
  userId: unknown,
  filters: unknown,
  tenantId: unknown
) {
  return validateDetail<Exported<DetailFilters>>(
    exportUserAuditDetailSchema,
    userId,
    filters,
    tenantId
  );
}
