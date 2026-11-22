import type { AuditExportFormat } from '@/app/api/lib/modules/audit-log/schemas/audit-log-schema';

/** `?format=` on the export routes: `csv` (the default) or `pdf`. */
export type AuditExportFormatParam = AuditExportFormat;

// GET /api/v1/audit-log/export responds with a file body, not JSON: text/csv for
// `format=csv` and application/pdf for `format=pdf`.
export type ExportAuditEventsResponse = string | Uint8Array;
