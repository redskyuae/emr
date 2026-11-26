'use client';

import { CiFileOn } from 'react-icons/ci';
import { PiFileXlsLight } from 'react-icons/pi';
import { toast } from 'sonner';

import type {
  AppointmentExportFormat,
  DownloadAppointmentsExportRequest,
} from '@/app/api/v1/appointments/export/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useDownloadAppointmentsExport } from '@/app/queries/appointments/useDownloadAppointmentsExport';
import { Button } from '@/components/ui/button';
import { captureAnalyticsEvent } from '@/lib/analytics/analytics-client';

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
  const { data: canExport } = useHasPermission('appointment:export');
  const pendingFormat = exportMutation.isPending ? exportMutation.variables?.format : undefined;

  async function download(format: AppointmentExportFormat) {
    try {
      await exportMutation.mutateAsync({ ...filters, format });
      captureAnalyticsEvent('export_downloaded', { export: 'appointments', format });
      toast.success(`${format === 'excel' ? 'Excel' : 'PDF'} downloaded.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const isDisabled = disabled || !hasAppointments || exportMutation.isPending;

  if (!canExport) {
    return null;
  }

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
        <PiFileXlsLight className="size-4" aria-hidden="true" />
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
        <CiFileOn className="size-4" aria-hidden="true" />
        {pendingFormat === 'pdf' ? 'Generating PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
