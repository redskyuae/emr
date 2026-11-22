import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  auditExportSearchParams,
  downloadAuditExport,
  type AuditExportFormat,
} from './download-audit-export';
import type { AuditEventsParams } from './useAuditEvents';

type AuditExportRequest = {
  format: AuditExportFormat;
  filters: Omit<AuditEventsParams, 'page' | 'limit'>;
};

function downloadAuditLog({ format, filters }: AuditExportRequest) {
  return downloadAuditExport(
    `/api/v1/audit-log/export?${auditExportSearchParams(filters, format)}`,
    format,
    'Could not export the Audit Events'
  );
}

export function useExportAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: downloadAuditLog,
    // The export records its own Audit Event, so the lists are now out of date.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['audit-events'] }),
        queryClient.invalidateQueries({ queryKey: ['user-audit'] }),
      ]);
    },
  });
}
