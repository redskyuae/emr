'use client';

import { CiImport } from 'react-icons/ci';
import { PiFileCsvLight, PiFilePdfLight } from 'react-icons/pi';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import type { AuditExportFormat } from '@/app/queries/audit-log/download-audit-export';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';
import { formatCount } from '@/lib/format-count';

const FORMATS: { format: AuditExportFormat; label: string; hint: string }[] = [
  { format: 'pdf', label: 'PDF', hint: 'A report to print or share' },
  { format: 'csv', label: 'CSV', hint: 'Every field, for Excel' },
];

/**
 * The Export button on the Audit Log pages: a menu of PDF and CSV. The caller
 * runs the download and says what it counted (events, users or Sessions).
 */
export function AuditExportMenu({
  disabled,
  pendingFormat,
  analyticsExport,
  countNoun,
  onExport,
}: {
  disabled: boolean;
  pendingFormat: AuditExportFormat | undefined;
  analyticsExport: 'audit_events' | 'user_audit_list' | 'user_audit';
  /** What the file's rows are, for the success message: "event", "user" or "Session". */
  countNoun: string;
  onExport: (format: AuditExportFormat) => Promise<{ rowCount: number }>;
}) {
  async function exportAs(format: AuditExportFormat) {
    try {
      const { rowCount } = await onExport(format);
      captureAnalyticsEvent('export_downloaded', { export: analyticsExport, format });
      toast.success(`${format.toUpperCase()} downloaded · ${formatCount(rowCount, countNoun)}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const isPending = pendingFormat !== undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isPending}
          aria-busy={isPending}
        >
          <CiImport className="size-4" aria-hidden="true" />
          {isPending ? `Exporting ${pendingFormat.toUpperCase()}…` : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FORMATS.map(({ format, label, hint }) => (
          <DropdownMenuItem key={format} onSelect={() => void exportAs(format)}>
            {format === 'pdf' ? (
              <PiFilePdfLight className="size-4" aria-hidden="true" />
            ) : (
              <PiFileCsvLight className="size-4" aria-hidden="true" />
            )}
            <div className="flex flex-col">
              <span>{label}</span>
              <span className="text-muted-foreground text-xs">{hint}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
