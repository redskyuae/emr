import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  auditExportSearchParams,
  downloadAuditExport,
  type AuditExportFormat,
} from './download-audit-export';

type UserAuditExportRequest = {
  format: AuditExportFormat;
  /** One member's report; the whole list when absent. */
  userId?: string;
  filters: { fromDate?: string; toDate?: string; query?: string };
};

function downloadUserAudit({ format, userId, filters }: UserAuditExportRequest) {
  const path = userId
    ? `/api/v1/audit-log/users/${encodeURIComponent(userId)}/export`
    : '/api/v1/audit-log/users/export';

  return downloadAuditExport(
    `${path}?${auditExportSearchParams(filters, format)}`,
    format,
    'Could not export User Audit Events'
  );
}

export function useExportUserAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: downloadUserAudit,
    // The export records its own Audit Event, so the lists are now out of date.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['audit-events'] }),
        queryClient.invalidateQueries({ queryKey: ['user-audit'] }),
      ]);
    },
  });
}
