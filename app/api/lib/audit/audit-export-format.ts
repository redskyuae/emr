// Formatting shared by the Audit Log and User Audit exports (CSV and PDF), so a
// time or a detail reads the same in every file.

import type { ExportBrand } from '@/app/api/lib/export/export-brand';
import type { PdfReportDetail } from '@/app/api/lib/export/pdf-report';

/** A date and time as the Tenant sees them: DD-MM-YYYY and 24-hour HH:MM:SS. */
export function auditLocalParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value])
  );

  return {
    date: `${parts.day}-${parts.month}-${parts.year}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

/** "22-11-2026 14:05:09", or the fallback when there is no time. */
export function auditLocalDateTime(date: Date | null, timeZone: string, fallback = '') {
  if (!date) return fallback;
  const { date: day, time } = auditLocalParts(date, timeZone);
  return `${day} ${time}`;
}

/** A YYYY-MM-DD range filter as DD-MM-YYYY. */
export function auditDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

/** The date range a report covers, in words. */
export function auditPeriodLabel(fromDate: string | undefined, toDate: string | undefined) {
  if (fromDate && toDate) return `${auditDisplayDate(fromDate)} to ${auditDisplayDate(toDate)}`;
  if (fromDate) return `From ${auditDisplayDate(fromDate)}`;
  if (toDate) return `Up to ${auditDisplayDate(toDate)}`;
  return 'All dates';
}

// Context that is not a field change, as readable "key: value" pairs. The
// support operator has its own column, so it is left out here.
export function describeAuditMetadata(metadata: Record<string, unknown> | null) {
  return Object.entries(metadata ?? {})
    .filter(([key]) => key !== 'impersonatedBy')
    .map(([key, value]) => {
      const text = Array.isArray(value)
        ? value
            .map((item) =>
              typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)
            )
            .join(', ') || '—'
        : typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value);
      return `${key}: ${text}`;
    })
    .join('; ');
}

/** Who exported a report, for whom and when: the facts every PDF report opens with. */
export type AuditReportContext = {
  brand: ExportBrand;
  tenantName: string;
  timeZone: string;
  exportedAt: Date;
  exportedBy: { name: string; email: string };
};

/** The report's details block: Tenant, the given period and count, who exported it and when. */
export function auditReportDetails(
  context: AuditReportContext,
  report: { period: string; count: PdfReportDetail; filters?: string }
): PdfReportDetail[] {
  const exportedAt = `${auditLocalDateTime(context.exportedAt, context.timeZone)} (${context.timeZone})`;

  return [
    { label: 'Tenant', value: context.tenantName || '—' },
    { label: 'Period', value: report.period },
    report.count,
    { label: 'Exported at', value: exportedAt },
    { label: 'Exported by', value: `${context.exportedBy.name} (${context.exportedBy.email})` },
    ...(report.filters === undefined
      ? []
      : [{ label: 'Filters', value: report.filters, wide: true }]),
  ];
}

/** The footer line on every page: the file holds personal data and says so. */
export function auditReportFooter(context: AuditReportContext) {
  return `Confidential · ${context.tenantName || 'Tenant'} · Exported ${auditLocalDateTime(context.exportedAt, context.timeZone)} by ${context.exportedBy.name}`;
}

/** A value cut to fit a report cell, ending in "..." when it was cut. */
export function auditTruncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

/** Today in the Tenant time zone as YYYY-MM-DD, for file names. */
export function auditFileDate(date: Date, timeZone: string) {
  const { date: day } = auditLocalParts(date, timeZone);
  const [dd, mm, yyyy] = day.split('-');
  return `${yyyy}-${mm}-${dd}`;
}
