import type { AuditExportFormatParam } from '@/app/api/v1/audit-log/export/types';
import { parseApiError } from '@/app/queries/api-error';

export type AuditExportFormat = AuditExportFormatParam;

/** The query string for an export: its filters, minus empty ones, plus the format. */
export function auditExportSearchParams(
  filters: Record<string, string | number | undefined>,
  format: AuditExportFormat
) {
  const searchParams = new URLSearchParams();

  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') searchParams.set(name, String(value));
  }

  searchParams.set('format', format);
  return searchParams;
}

function filenameFrom(response: Response, format: AuditExportFormat) {
  const disposition = response.headers.get('Content-Disposition') ?? '';

  return /filename="([^"]+)"/.exec(disposition)?.[1] ?? `audit-export.${format}`;
}

/**
 * Fetches an Audit Log export and hands it to the browser as a download. The
 * server counts what it exported (events, users or Sessions) in a header.
 */
export async function downloadAuditExport(
  url: string,
  format: AuditExportFormat,
  errorMessage: string
) {
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, errorMessage);
  }

  const rowCount = Number(response.headers.get('X-Audit-Row-Count') ?? 0);
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filenameFrom(response, format);
  link.click();
  URL.revokeObjectURL(objectUrl);

  return { rowCount };
}
