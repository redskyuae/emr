'use client';

import { FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

import type {
  AppointmentExportFormat,
  DownloadAppointmentsExportRequest,
} from '@/app/api/v1/appointments/export/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDownloadAppointmentsExport } from '@/app/queries/appointments/useDownloadAppointmentsExport';
import { Button } from '@/components/ui/button';

export function AppointmentExportActions({
  disabled,
  filters,
  hasAppointments,
}: {
  disabled: boolean;
  filters: Omit<DownloadAppointmentsExportRequest, 'format'>;
  hasAppointments: boolean;
}) {
  const exportMutation = useDownloadAppointmentsExport();
  const pendingFormat = exportMutation.isPending ? exportMutation.variables?.format : undefined;

  async function download(format: AppointmentExportFormat) {
    try {
      await exportMutation.mutateAsync({ ...filters, format });
      toast.success(`${format === 'excel' ? 'Excel' : 'PDF'} downloaded.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const isDisabled = disabled || !hasAppointments || exportMutation.isPending;

  return (
    <div className="flex flex-1 gap-2 sm:flex-none">
      <Button
        type="button"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={isDisabled}
        aria-busy={pendingFormat === 'excel'}
        onClick={() => void download('excel')}
      >
        <FileSpreadsheet className="size-4" aria-hidden="true" />
        {pendingFormat === 'excel' ? 'Generating Excel...' : 'Download Excel'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={isDisabled}
        aria-busy={pendingFormat === 'pdf'}
        onClick={() => void download('pdf')}
      >
        <FileText className="size-4" aria-hidden="true" />
        {pendingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
